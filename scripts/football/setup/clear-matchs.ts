import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

// Configuration Firebase FUFC
const firebaseConfig = {
  apiKey: 'AIzaSyCGsb39fQM7qdaY_oTEQfw0ex-jJPAfv_U',
  authDomain: 'fufc-8c9fc.firebaseapp.com',
  projectId: 'fufc-8c9fc',
  storageBucket: 'fufc-8c9fc.firebasestorage.app',
  messagingSenderId: '702980907146',
  appId: '1:702980907146:web:9086aa0ab1ef3851be8d73',
  measurementId: 'G-J9ZRZTVZ92',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function clearMatchs() {
  console.log('🗑️  Suppression de tous les matchs de la base FUFC...\n');

  const matchsRef = collection(db, 'matchs');
  const snapshot = await getDocs(matchsRef);

  if (snapshot.empty) {
    console.log('✅ Aucun match à supprimer (collection déjà vide)');
    return;
  }

  console.log(`📊 ${snapshot.size} match(s) trouvé(s)\n`);

  let deleted = 0;
  for (const docSnapshot of snapshot.docs) {
    await deleteDoc(doc(db, 'matchs', docSnapshot.id));
    deleted++;
    console.log(`✅ Match ${deleted}/${snapshot.size} supprimé`);
  }

  console.log(`\n✅ ${deleted} match(s) supprimé(s) avec succès !`);
}

clearMatchs().catch(console.error);
