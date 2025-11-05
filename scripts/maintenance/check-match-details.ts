import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { firebaseConfig } from '../config/firebase-config';

// Initialiser Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkMatchDetails() {
  try {
    console.log('🔍 Vérification détaillée des matchs PNM\n');

    const q = query(
      collection(db, 'matchs'),
      where('championnatId', '==', 'prenationale-m'),
      limit(3)
    );
    const snapshot = await getDocs(q);

    console.log(`Affichage de ${snapshot.size} matchs:\n`);

    for (const matchDoc of snapshot.docs) {
      const match = matchDoc.data();
      console.log('─'.repeat(60));
      console.log(`📋 Match ${matchDoc.id}`);
      console.log(`   Journée: ${match.journee}`);
      console.log(`   Date: ${match.date}`);
      console.log(`   Domicile: "${match.equipeDomicile}"`);
      console.log(`   Domicile ID: ${match.equipeDomicileId || 'AUCUN'}`);
      console.log(`   Extérieur: "${match.equipeExterieur}"`);
      console.log(`   Extérieur ID: ${match.equipeExterieurId || 'AUCUN'}`);
      console.log(`   Score: ${match.scoreDomicile || '-'} - ${match.scoreExterieur || '-'}`);
      console.log(`   Statut: ${match.statut}`);

      // Récupérer les infos des équipes
      if (match.equipeDomicileId) {
        const equipeQuery = query(
          collection(db, 'equipes'),
          where('__name__', '==', match.equipeDomicileId)
        );
        // Note: pour chercher par ID directement, on devrait utiliser getDoc avec doc()
      }

      console.log();
    }
  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  }
}

checkMatchDetails()
  .then(() => {
    console.log('✅ Script terminé');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale:', error);
    process.exit(1);
  });
