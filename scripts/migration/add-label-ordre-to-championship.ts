// Script to add label and ordre fields to D3 Matin championship
// Run with: npx tsx scripts/migration/add-label-ordre-to-championship.ts

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';

// FUFC Firebase config
const fufcConfig = {
  apiKey: 'AIzaSyCGsb39fQM7qdaY_oTEQfw0ex-jJPAfv_U',
  authDomain: 'fufc-8c9fc.firebaseapp.com',
  projectId: 'fufc-8c9fc',
  storageBucket: 'fufc-8c9fc.firebasestorage.app',
  messagingSenderId: '702980907146',
  appId: '1:702980907146:web:9086aa0ab1ef3851be8d73',
  measurementId: 'G-J9ZRZTVZ92',
};

// Initialize Firebase for FUFC
const fufcApp = initializeApp(fufcConfig, 'fufc');
const db = getFirestore(fufcApp);

async function main() {
  console.log('🔄 Mise à jour du championnat D3 Matin...\n');

  // Find D3 Matin championship
  const championnatsRef = collection(db, 'championnats');
  const q = query(championnatsRef, where('nom', '==', 'D3 Matin'));
  const championnatsSnapshot = await getDocs(q);

  if (championnatsSnapshot.empty) {
    console.log('❌ Championnat D3 Matin non trouvé');
    return;
  }

  const championnatDoc = championnatsSnapshot.docs[0];
  const championnatId = championnatDoc.id;

  console.log(`✅ Championnat trouvé: ${championnatId}`);

  // Update with label and ordre
  const championnatRef = doc(db, 'championnats', championnatId);
  await updateDoc(championnatRef, {
    label: 'D3 Matin',
    ordre: 1
  });

  console.log('✅ Champs "label" et "ordre" ajoutés avec succès !');
  console.log('   label: "D3 Matin"');
  console.log('   ordre: 1');
}

main().catch((err) => console.error(err));
