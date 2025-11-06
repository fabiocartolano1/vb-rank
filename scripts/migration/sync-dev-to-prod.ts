import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import * as readline from 'readline';

// Importer les environnements
const devEnv = require('../../src/environments/environment.development');
const prodEnv = require('../../src/environments/environment.production');

// Initialiser Firebase pour les deux environnements
const devApp = initializeApp(devEnv.environment.firebase, 'dev');
const prodApp = initializeApp(prodEnv.environment.firebase, 'prod');

const devDb = getFirestore(devApp);
const prodDb = getFirestore(prodApp);

// Interface pour suivre les statistiques de synchronisation
interface SyncStats {
  collection: string;
  total: number;
  added: number;
  updated: number;
  skipped: number;
  errors: number;
}

// Collections à synchroniser
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
async function countDocuments(db: any, collectionName: string): Promise<number> {
  const snapshot = await getDocs(collection(db, collectionName));
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
 * Vérifie si deux documents sont identiques
 */
function areDocumentsEqual(doc1: any, doc2: any): boolean {
  return JSON.stringify(doc1) === JSON.stringify(doc2);
}

/**
 * Synchronise une collection de dev vers prod (mode incrémental)
 */
async function syncCollection(
  collectionName: string,
  overwrite: boolean = false
): Promise<SyncStats> {
  const stats: SyncStats = {
    collection: collectionName,
    total: 0,
    added: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
  };

  console.log(`\n🔄 Synchronisation de la collection "${collectionName}"...`);

  try {
    // Récupérer tous les documents de la collection dev
    const devSnapshot = await getDocs(collection(devDb, collectionName));
    stats.total = devSnapshot.size;

    if (stats.total === 0) {
      console.log(`   ⚠️  Aucun document trouvé dans "${collectionName}"`);
      return stats;
    }

    console.log(`   📦 ${stats.total} documents à synchroniser`);

    // Utiliser des batches pour optimiser les écritures
    let batch = writeBatch(prodDb);
    let batchCount = 0;
    const BATCH_SIZE = 500;

    for (const docSnapshot of devSnapshot.docs) {
      try {
        const data = docSnapshot.data();
        const docRef = doc(prodDb, collectionName, docSnapshot.id);

        // Vérifier si le document existe déjà en prod
        const prodDocSnapshot = await getDoc(docRef);

        if (prodDocSnapshot.exists()) {
          if (overwrite) {
            // Mode écrasement : toujours mettre à jour
            batch.set(docRef, data);
            batchCount++;
            stats.updated++;
          } else {
            // Mode incrémental : mettre à jour seulement si différent
            const prodData = prodDocSnapshot.data();
            if (!areDocumentsEqual(data, prodData)) {
              batch.set(docRef, data);
              batchCount++;
              stats.updated++;
            } else {
              stats.skipped++;
            }
          }
        } else {
          // Document n'existe pas : l'ajouter
          batch.set(docRef, data);
          batchCount++;
          stats.added++;
        }

        // Commit le batch si on atteint la limite
        if (batchCount >= BATCH_SIZE) {
          await batch.commit();
          const processed = stats.added + stats.updated + stats.skipped;
          console.log(`   🔄 ${processed}/${stats.total} documents traités`);
          batch = writeBatch(prodDb);
          batchCount = 0;
        }
      } catch (error) {
        stats.errors++;
        console.error(
          `   ❌ Erreur lors de la synchronisation du document ${docSnapshot.id}:`,
          error
        );
      }
    }

    // Commit le dernier batch s'il reste des documents
    if (batchCount > 0) {
      await batch.commit();
    }

    console.log(`   ✅ Synchronisation terminée:`);
    console.log(`      • ${stats.added} nouveaux documents ajoutés`);
    console.log(`      • ${stats.updated} documents mis à jour`);
    console.log(`      • ${stats.skipped} documents inchangés (ignorés)`);

    if (stats.errors > 0) {
      console.log(`   ⚠️  ${stats.errors} erreurs rencontrées`);
    }
  } catch (error) {
    console.error(
      `   ❌ Erreur lors de la synchronisation de la collection "${collectionName}":`,
      error
    );
  }

  return stats;
}

/**
 * Fonction principale de synchronisation
 */
async function sync() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  🔄 Synchronisation DEV → PROD (Mode Incrémental)         ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  console.log('\n📡 Connexion aux bases de données...');
  console.log(`   DEV:  ${devEnv.environment.firebase.projectId}`);
  console.log(`   PROD: ${prodEnv.environment.firebase.projectId}`);

  // Afficher les statistiques actuelles
  await displayStats();

  // Demander le mode de synchronisation
  console.log('💡 Mode de synchronisation:');
  console.log('   • Incrémental: Ajoute les nouveaux documents et met à jour ceux modifiés');
  console.log('   • Écrasement: Met à jour tous les documents (même identiques)');

  const overwrite = await askConfirmation('\nUtiliser le mode écrasement ?');

  console.log(`\n🔧 Mode sélectionné: ${overwrite ? 'ÉCRASEMENT' : 'INCRÉMENTAL'}`);

  // Demander confirmation finale
  const confirmed = await askConfirmation('\nVoulez-vous continuer ?');

  if (!confirmed) {
    console.log("\n❌ Synchronisation annulée par l'utilisateur.");
    process.exit(0);
  }

  // Synchroniser chaque collection
  const allStats: SyncStats[] = [];

  for (const collectionName of COLLECTIONS) {
    const stats = await syncCollection(collectionName, overwrite);
    allStats.push(stats);
  }

  // Afficher le résumé final
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  📊 Résumé de la synchronisation                           ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  let totalAdded = 0;
  let totalUpdated = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  for (const stats of allStats) {
    totalAdded += stats.added;
    totalUpdated += stats.updated;
    totalSkipped += stats.skipped;
    totalErrors += stats.errors;

    const status = stats.errors === 0 ? '✅' : '⚠️';
    console.log(`${status} ${stats.collection.padEnd(15)} :`);
    console.log(`   • ${stats.added} ajoutés`);
    console.log(`   • ${stats.updated} mis à jour`);
    console.log(`   • ${stats.skipped} ignorés`);
  }

  console.log('\n' + '─'.repeat(60));
  console.log(
    `📦 Total: ${totalAdded} ajoutés, ${totalUpdated} mis à jour, ${totalSkipped} ignorés`
  );

  if (totalErrors > 0) {
    console.log(`⚠️  ${totalErrors} erreurs rencontrées`);
  }

  // Afficher les nouvelles statistiques
  console.log('\n📊 Nouvelles statistiques:');
  await displayStats();

  console.log('✅ Synchronisation terminée!\n');
}

// Exécuter la synchronisation
sync()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale lors de la synchronisation:', error);
    process.exit(1);
  });
