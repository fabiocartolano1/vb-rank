import * as admin from 'firebase-admin';
import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';

// Fonction pour charger le service account depuis env ou fichier
function loadServiceAccount(envVar: string, fallbackFile: string): any {
  // Essayer depuis la variable d'environnement d'abord
  if (process.env[envVar]) {
    try {
      return JSON.parse(process.env[envVar]);
    } catch (error) {
      console.error(`❌ Erreur lors du parsing de ${envVar}:`, error);
    }
  }

  // Sinon, essayer depuis un fichier local
  const filePath = path.join(process.cwd(), fallbackFile);
  if (fs.existsSync(filePath)) {
    console.log(`📁 Lecture du service account depuis ${fallbackFile}`);
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }

  throw new Error(`Service account non trouvé. Définissez ${envVar} ou créez ${fallbackFile}`);
}

// Initialiser Firebase Admin pour les deux environnements
const devServiceAccount = loadServiceAccount(
  'FIREBASE_SERVICE_ACCOUNT_DEV',
  'service-account-dev.json'
);
const prodServiceAccount = loadServiceAccount(
  'FIREBASE_SERVICE_ACCOUNT_PROD',
  'service-account-prod.json'
);

const devApp = admin.initializeApp(
  {
    credential: admin.credential.cert(devServiceAccount),
  },
  'dev'
);

const prodApp = admin.initializeApp(
  {
    credential: admin.credential.cert(prodServiceAccount),
  },
  'prod'
);

const devDb = admin.firestore(devApp);
const prodDb = admin.firestore(prodApp);

// Interface pour suivre les statistiques de migration
interface MigrationStats {
  collection: string;
  total: number;
  migrated: number;
  errors: number;
}

// Collections à migrer
const COLLECTIONS = ['championnats', 'equipes', 'matchs'];

/**
 * Demande confirmation à l'utilisateur
 */
async function askConfirmation(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question + ' (oui/non): ', (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'oui' || answer.toLowerCase() === 'o');
    });
  });
}

/**
 * Compte le nombre de documents dans une collection
 */
async function countDocuments(db: admin.firestore.Firestore, collectionName: string): Promise<number> {
  const snapshot = await db.collection(collectionName).get();
  return snapshot.size;
}

/**
 * Affiche les statistiques des bases de données
 */
async function displayStats() {
  console.log('\n📊 Statistiques des bases de données:\n');
  console.log('┌─────────────────┬──────────────┬──────────────┐');
  console.log('│ Collection      │ DEV (source) │ PROD (cible) │');
  console.log('├─────────────────┼──────────────┼──────────────┤');

  for (const collectionName of COLLECTIONS) {
    const devCount = await countDocuments(devDb, collectionName);
    const prodCount = await countDocuments(prodDb, collectionName);
    console.log(
      `│ ${collectionName.padEnd(15)} │ ${String(devCount).padStart(12)} │ ${String(
        prodCount
      ).padStart(12)} │`
    );
  }

  console.log('└─────────────────┴──────────────┴──────────────┘\n');
}

/**
 * Migre une collection de dev vers prod
 */
async function migrateCollection(collectionName: string): Promise<MigrationStats> {
  const stats: MigrationStats = {
    collection: collectionName,
    total: 0,
    migrated: 0,
    errors: 0,
  };

  console.log(`\n🔄 Migration de la collection "${collectionName}"...`);

  try {
    // Récupérer tous les documents de la collection dev
    const devSnapshot = await devDb.collection(collectionName).get();
    stats.total = devSnapshot.size;

    if (stats.total === 0) {
      console.log(`   ⚠️  Aucun document trouvé dans "${collectionName}"`);
      return stats;
    }

    console.log(`   📦 ${stats.total} documents à migrer`);

    // Utiliser des batches pour optimiser les écritures
    let batch = prodDb.batch();
    let batchCount = 0;
    const BATCH_SIZE = 500; // Firestore limite à 500 opérations par batch

    for (const docSnapshot of devSnapshot.docs) {
      try {
        const data = docSnapshot.data();
        const docRef = prodDb.collection(collectionName).doc(docSnapshot.id);

        batch.set(docRef, data);
        batchCount++;

        // Commit le batch si on atteint la limite
        if (batchCount >= BATCH_SIZE) {
          await batch.commit();
          stats.migrated += batchCount;
          console.log(`   ✅ ${stats.migrated}/${stats.total} documents migrés`);
          batch = prodDb.batch();
          batchCount = 0;
        }
      } catch (error) {
        stats.errors++;
        console.error(`   ❌ Erreur lors de la migration du document ${docSnapshot.id}:`, error);
      }
    }

    // Commit le dernier batch s'il reste des documents
    if (batchCount > 0) {
      await batch.commit();
      stats.migrated += batchCount;
    }

    console.log(`   ✅ ${stats.migrated}/${stats.total} documents migrés avec succès`);

    if (stats.errors > 0) {
      console.log(`   ⚠️  ${stats.errors} erreurs rencontrées`);
    }
  } catch (error) {
    console.error(`   ❌ Erreur lors de la migration de la collection "${collectionName}":`, error);
  }

  return stats;
}

/**
 * Fonction principale de migration
 */
async function migrate() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  🚀 Migration des données DEV vers PROD (Admin SDK)       ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  console.log('\n📡 Connexion aux bases de données...');
  console.log(`   DEV:  ${devServiceAccount.project_id}`);
  console.log(`   PROD: ${prodServiceAccount.project_id}`);

  // Afficher les statistiques actuelles
  await displayStats();

  // Demander confirmation
  console.log('⚠️  ATTENTION: Cette opération va COPIER toutes les données de DEV vers PROD.');
  console.log('   Les documents existants en PROD avec le même ID seront ÉCRASÉS.');

  const confirmed = await askConfirmation('\nVoulez-vous continuer ?');

  if (!confirmed) {
    console.log("\n❌ Migration annulée par l'utilisateur.");
    process.exit(0);
  }

  // Migrer chaque collection
  const allStats: MigrationStats[] = [];

  for (const collectionName of COLLECTIONS) {
    const stats = await migrateCollection(collectionName);
    allStats.push(stats);
  }

  // Afficher le résumé final
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  📊 Résumé de la migration                                 ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  let totalMigrated = 0;
  let totalErrors = 0;

  for (const stats of allStats) {
    totalMigrated += stats.migrated;
    totalErrors += stats.errors;

    const status = stats.errors === 0 ? '✅' : '⚠️';
    console.log(
      `${status} ${stats.collection.padEnd(15)} : ${stats.migrated}/${stats.total} migrés`
    );
  }

  console.log('\n' + '─'.repeat(60));
  console.log(`📦 Total: ${totalMigrated} documents migrés`);

  if (totalErrors > 0) {
    console.log(`⚠️  ${totalErrors} erreurs rencontrées`);
  }

  // Afficher les nouvelles statistiques
  console.log('\n📊 Nouvelles statistiques:');
  await displayStats();

  console.log('✅ Migration terminée!\n');
}

// Exécuter la migration
migrate()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale lors de la migration:', error);
    process.exit(1);
  });
