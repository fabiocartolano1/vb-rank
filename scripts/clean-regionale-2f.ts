import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
} from 'firebase/firestore';

// Configuration Firebase
const firebaseConfig = {
  apiKey: 'AIzaSyAVyJsXC8G6C-U4zVJY74ipXPBA8xE0hbM',
  authDomain: 'vb-rank.firebaseapp.com',
  projectId: 'vb-rank',
  storageBucket: 'vb-rank.firebasestorage.app',
  messagingSenderId: '359434513058',
  appId: '1:359434513058:web:82616930a7644cce0345fb',
  measurementId: 'G-DGTX5LPX5C',
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function cleanRegionale2F() {
  console.log('🧹 Nettoyage des données Régionale 2 F incorrectes...\n');

  try {
    // Supprimer toutes les équipes de Régionale 2 F
    // console.log('📥 Récupération des équipes Régionale 2 F...');
    // const equipesQuery = query(
    //   collection(db, 'equipes'),
    //   where('championnatId', '==', 'regionale-2-f')
    // );
    // const equipesSnapshot = await getDocs(equipesQuery);

    // console.log(`✅ ${equipesSnapshot.size} équipes trouvées`);

    // let deleteCount = 0;
    // for (const docSnapshot of equipesSnapshot.docs) {
    //   await deleteDoc(doc(db, 'equipes', docSnapshot.id));
    //   console.log(`🗑️  ${docSnapshot.data().nom} supprimée`);
    //   deleteCount++;
    // }

    // console.log(`\n✅ ${deleteCount} équipes supprimées`);

    // Supprimer tous les matchs de Régionale 2 F
    console.log('\n📥 Récupération des matchs Régionale 2 F...');
    const matchsQuery = query(
      collection(db, 'matchs'),
      where('championnatId', '==', 'regionale-2-f')
    );
    const matchsSnapshot = await getDocs(matchsQuery);

    console.log(`✅ ${matchsSnapshot.size} matchs trouvés`);

    let deleteCount = 0;
    for (const docSnapshot of matchsSnapshot.docs) {
      await deleteDoc(doc(db, 'matchs', docSnapshot.id));
      deleteCount++;
      if (deleteCount % 10 === 0) {
        console.log(`🗑️  ${deleteCount}/${matchsSnapshot.size} matchs supprimés...`);
      }
    }

    console.log(`\n✅ ${deleteCount} matchs supprimés`);

    console.log('\n🎉 Nettoyage terminé avec succès !');
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
    throw error;
  }
}

cleanRegionale2F()
  .then(() => {
    console.log('\n✅ Script terminé');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale:', error);
    process.exit(1);
  });
