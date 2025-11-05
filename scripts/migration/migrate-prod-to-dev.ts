import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  writeBatch,
  doc,
  deleteDoc,
  query,
} from 'firebase/firestore';
import * as readline from 'readline';

// Import des configurations d'environnement
const prodEnv = require('../src/environments/environment.production');
const devEnv = require('../src/environments/environment.development');

// Initialiser les deux apps Firebase
const prodApp = initializeApp(prodEnv.environment.firebase, 'prod');
const devApp = initializeApp(devEnv.environment.firebase, 'dev');

// Obtenir les instances Firestore
const prodDb = getFirestore(prodApp);
const devDb = getFirestore(devApp);

// Collections à migrer
const COLLECTIONS = ['championnats', 'equipes', 'matchs'];

// Taille maximale d'un batch Firestore
const BATCH_SIZE = 500;

interface Stats {
  [key: string]: {
    prod: number;
    dev: number;
  };
}

/**
 * Compte les documents dans chaque collection
 */
async function getCollectionStats(): Promise<Stats> {
  const stats: Stats = {};

  for (const collectionName of COLLECTIONS) {
    const prodSnapshot = await getDocs(collection(prodDb, collectionName));
    const devSnapshot = await getDocs(collection(devDb, collectionName));

    stats[collectionName] = {
      prod: prodSnapshot.size,
      dev: devSnapshot.size,
    };
  }

  return stats;
}

/**
 * Affiche les statistiques des bases de données
 */
function displayStats(stats: Stats) {
  console.log('\n📊 Statistiques des bases de données:\n');
  console.log('┌─────────────────┬──────────────┬──────────────┐');
  console.log('│ Collection      │ PROD (source)│ DEV (cible)  │');
  console.log('├─────────────────┼──────────────┼──────────────┤');

  for (const [collectionName, counts] of Object.entries(stats)) {
    const paddedName = collectionName.padEnd(15);
    const prodCount = counts.prod.toString().padStart(12);
    const devCount = counts.dev.toString().padStart(12);
    console.log(`│ ${paddedName} │${prodCount} │${devCount} │`);
  }

  console.log('└─────────────────┴──────────────┴──────────────┘\n');
}

/**
 * Demande confirmation à l'utilisateur
 */
async function askConfirmation(): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question('Voulez-vous continuer ? (oui/non): ', (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'oui' || answer.toLowerCase() === 'o');
    });
  });
}

/**
 * Supprime tous les documents d'une collection
 */
async function clearCollection(db: any, collectionName: string): Promise<void> {
  const snapshot = await getDocs(collection(db, collectionName));
  const deletePromises = snapshot.docs.map((document) =>
    deleteDoc(doc(db, collectionName, document.id))
  );
  await Promise.all(deletePromises);
}

/**
 * Migre une collection de PROD vers DEV
 */
async function migrateCollection(collectionName: string): Promise<number> {
  console.log(`\n🔄 Migration de la collection "${collectionName}"...`);

  // Récupérer tous les documents de PROD
  const prodSnapshot = await getDocs(collection(prodDb, collectionName));
  const totalDocs = prodSnapshot.size;

  if (totalDocs === 0) {
    console.log(`   ⚠️  Aucun document à migrer`);
    return 0;
  }

  console.log(`   📦 ${totalDocs} documents à migrer`);

  // Supprimer les documents existants en DEV
  console.log(`   🗑️  Suppression des documents existants en DEV...`);
  await clearCollection(devDb, collectionName);

  // Migrer par batches
  let batch = writeBatch(devDb);
  let batchCount = 0;
  let successCount = 0;

  for (const document of prodSnapshot.docs) {
    const docRef = doc(devDb, collectionName, document.id);
    batch.set(docRef, document.data());
    batchCount++;

    // Commit le batch quand il atteint la taille maximale
    if (batchCount === BATCH_SIZE) {
      await batch.commit();
      successCount += batchCount;
      console.log(`   ✅ ${successCount}/${totalDocs} documents migrés`);
      batch = writeBatch(devDb);
      batchCount = 0;
    }
  }

  // Commit le dernier batch s'il contient des documents
  if (batchCount > 0) {
    await batch.commit();
    successCount += batchCount;
  }

  console.log(`   ✅ ${successCount}/${totalDocs} documents migrés avec succès`);
  return successCount;
}

/**
 * Fonction principale
 */
async function main() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  🔄 Migration des données PROD vers DEV                   ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  console.log('📡 Connexion aux bases de données...');
  console.log('   PROD (source): le-cres-vb');
  console.log('   DEV (cible):   vb-rank');

  // Récupérer et afficher les statistiques
  const stats = await getCollectionStats();
  displayStats(stats);

  // Avertissement
  console.log('⚠️  ATTENTION: Cette opération va:');
  console.log('   1. SUPPRIMER toutes les données de DEV');
  console.log('   2. COPIER toutes les données de PROD vers DEV');
  console.log('   3. Cette action est IRRÉVERSIBLE!\n');

  // Demander confirmation
  const confirmed = await askConfirmation();

  if (!confirmed) {
    console.log('\n❌ Migration annulée par l\'utilisateur.\n');
    process.exit(0);
  }

  // Migrer chaque collection
  const results: { [key: string]: number } = {};

  for (const collectionName of COLLECTIONS) {
    try {
      const count = await migrateCollection(collectionName);
      results[collectionName] = count;
    } catch (error) {
      console.error(`\n❌ Erreur lors de la migration de "${collectionName}":`, error);
      process.exit(1);
    }
  }

  // Afficher le résumé
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  📊 Résumé de la migration                                 ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  for (const [collectionName, count] of Object.entries(results)) {
    const paddedName = collectionName.padEnd(18);
    console.log(`✅ ${paddedName}: ${count} documents migrés`);
  }

  const total = Object.values(results).reduce((sum, count) => sum + count, 0);
  console.log(`\n📦 Total: ${total} documents migrés`);

  console.log('\n✅ Migration terminée!\n');
  console.log('💡 Conseil: Vérifiez que vos données DEV correspondent bien à PROD.\n');

  process.exit(0);
}

// Exécuter le script
main().catch((error) => {
  console.error('\n❌ Erreur fatale:', error);
  process.exit(1);
});
