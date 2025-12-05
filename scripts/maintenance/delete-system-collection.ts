import { getFirestoreAdmin } from '../config/firebase-admin-config.js';

console.log('📁 Initialisation de Firebase Admin...');

async function deleteSystemCollection() {
  try {
    // Initialiser Firebase Admin et obtenir Firestore
    const db = getFirestoreAdmin();
    console.log('✅ Connexion à Firestore réussie\n');

    // Récupérer tous les documents de la collection _system
    console.log('🔍 Récupération de la collection _system...');
    const systemSnapshot = await db.collection('_system').get();

    if (systemSnapshot.empty) {
      console.log('✅ La collection _system est déjà vide ou n\'existe pas');
      process.exit(0);
      return;
    }

    console.log(`📊 ${systemSnapshot.size} document(s) trouvé(s) dans la collection _system\n`);

    // Supprimer tous les documents en batch
    const batchSize = 500; // Firestore limite les batch à 500 opérations
    let deletedCount = 0;

    // Traiter par lots de 500 documents
    for (let i = 0; i < systemSnapshot.docs.length; i += batchSize) {
      const batch = db.batch();
      const batchDocs = systemSnapshot.docs.slice(i, i + batchSize);

      console.log(`🗑️  Suppression du lot ${Math.floor(i / batchSize) + 1} (${batchDocs.length} documents)...`);

      for (const doc of batchDocs) {
        console.log(`   - Suppression du document: ${doc.id}`);
        batch.delete(doc.ref);
      }

      await batch.commit();
      deletedCount += batchDocs.length;
      console.log(`✅ Lot supprimé avec succès (${deletedCount}/${systemSnapshot.size})\n`);
    }

    console.log(`✅ Collection _system supprimée avec succès`);
    console.log(`📊 Total de documents supprimés: ${deletedCount}`);
    console.log('\n✨ Script terminé avec succès');
    process.exit(0);

  } catch (error) {
    console.error('❌ Erreur lors de la suppression de la collection _system:', error);
    process.exit(1);
  }
}

// Exécuter le script
deleteSystemCollection();
