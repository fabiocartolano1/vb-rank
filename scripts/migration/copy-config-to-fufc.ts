import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc, writeBatch } from 'firebase/firestore';

// Importer les environnements
const cresEnv = require('../../src/environments/environment.production');
const fufcEnv = require('../../src/environments/environment.fufc');

// Initialiser Firebase pour les deux environnements
const cresApp = initializeApp(cresEnv.environment.firebase, 'cres');
const fufcApp = initializeApp(fufcEnv.environment.firebase, 'fufc');

const sourceDb = getFirestore(cresApp);
const destDb = getFirestore(fufcApp);

async function copyConfigCollection() {
  try {
    console.log('🔄 Copie de la collection config de le-cres-vb vers fufc...\n');

    // Récupérer tous les documents de la collection config source
    const configRef = collection(sourceDb, 'config');
    const configSnapshot = await getDocs(configRef);

    if (configSnapshot.empty) {
      console.log('❌ Aucun document trouvé dans la collection config source');
      return;
    }

    console.log(`📦 ${configSnapshot.size} document(s) trouvé(s) dans la collection config\n`);

    let copiedCount = 0;
    const batch = writeBatch(destDb);

    // Copier chaque document
    for (const docSnapshot of configSnapshot.docs) {
      const docRef = doc(destDb, 'config', docSnapshot.id);
      const data = docSnapshot.data();

      console.log(`📄 Copie du document: ${docSnapshot.id}`);
      console.log(`   Données:`, JSON.stringify(data, null, 2));

      batch.set(docRef, data);
      copiedCount++;
    }

    // Exécuter le batch
    await batch.commit();

    console.log(`\n✅ ${copiedCount} document(s) copié(s) avec succès !`);
    console.log('\n🎉 Migration terminée !');

  } catch (error) {
    console.error('❌ Erreur lors de la copie:', error);
    throw error;
  }
}

// Exécuter la migration
copyConfigCollection()
  .then(() => {
    console.log('✅ Script terminé');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur:', error);
    process.exit(1);
  });
