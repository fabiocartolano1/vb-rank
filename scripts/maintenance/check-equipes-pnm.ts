import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { firebaseConfig } from '../config/firebase-config';

// Initialiser Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkEquipes() {
  try {
    console.log('🔍 Vérification des équipes PNM\n');

    const q = query(
      collection(db, 'equipes'),
      where('championnatId', '==', 'prenationale-m')
    );
    const snapshot = await getDocs(q);

    console.log(`✅ ${snapshot.size} équipes trouvées\n`);

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      console.log(`📋 ${data.nom}`);
      console.log(`   ID: ${doc.id}`);
      console.log(`   Logo: ${data.logoUrl || 'AUCUN LOGO'}`);
      console.log();
    });

    // Vérifier aussi un match
    console.log('\n🔍 Vérification d\'un match PNM\n');
    const matchQuery = query(
      collection(db, 'matchs'),
      where('championnatId', '==', 'prenationale-m')
    );
    const matchSnapshot = await getDocs(matchQuery);

    if (matchSnapshot.size > 0) {
      const firstMatch = matchSnapshot.docs[0].data();
      console.log('📋 Premier match:');
      console.log(`   ${firstMatch.equipeDomicile} vs ${firstMatch.equipeExterieur}`);
      console.log(`   equipeDomicileId: ${firstMatch.equipeDomicileId || 'AUCUN'}`);
      console.log(`   equipeExterieurId: ${firstMatch.equipeExterieurId || 'AUCUN'}`);
    }
  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  }
}

checkEquipes()
  .then(() => {
    console.log('\n✅ Script terminé');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale:', error);
    process.exit(1);
  });
