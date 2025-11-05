import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { firebaseConfig } from '../config/firebase-config';

// Initialiser Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function deleteMatchsPnm() {
  try {
    console.log('🗑️  Suppression des matchs Pré-nationale M\n');

    // Récupérer tous les matchs PNM
    console.log('📥 Récupération des matchs...');
    const q = query(
      collection(db, 'matchs'),
      where('championnatId', '==', 'prenationale-m')
    );
    const snapshot = await getDocs(q);

    console.log(`✅ ${snapshot.size} matchs trouvés\n`);

    if (snapshot.size === 0) {
      console.log('⚠️  Aucun match à supprimer');
      return;
    }

    // Supprimer chaque match
    console.log('🗑️  Suppression en cours...');
    let count = 0;
    for (const matchDoc of snapshot.docs) {
      await deleteDoc(doc(db, 'matchs', matchDoc.id));
      count++;
      if (count % 10 === 0) {
        console.log(`  ${count}/${snapshot.size} matchs supprimés...`);
      }
    }

    console.log(`\n✅ ${count} matchs supprimés avec succès !`);
    console.log('🎉 Nettoyage terminé');
  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  }
}

deleteMatchsPnm()
  .then(() => {
    console.log('\n✅ Script terminé');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale:', error);
    process.exit(1);
  });
