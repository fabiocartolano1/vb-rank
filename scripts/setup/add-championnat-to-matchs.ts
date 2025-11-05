import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { firebaseConfig } from '../config/firebase-config';

// Initialiser Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function addChampionnatToMatchs() {
  console.log('⚽ Ajout du championnat aux matchs...\n');

  try {
    // 1. Récupérer tous les matchs
    console.log('📥 Récupération des matchs...');
    const matchsSnapshot = await getDocs(collection(db, 'matchs'));
    const matchs: Array<{ id: string; equipeDomicile: string; equipeExterieur: string }> = [];

    matchsSnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      matchs.push({
        id: docSnap.id,
        equipeDomicile: data.equipeDomicile,
        equipeExterieur: data.equipeExterieur,
      });
    });

    console.log(`✅ ${matchs.length} matchs trouvés\n`);

    // 2. Mettre à jour tous les matchs avec le championnatId
    // Pour l'instant, tous les matchs sont dans "Régionale 2 M"
    const regionaleM2Id = 'regionale-2-m';
    console.log(`🔄 Mise à jour des matchs avec championnatId: ${regionaleM2Id}...`);

    let updateCount = 0;
    let errorCount = 0;

    for (const match of matchs) {
      try {
        const matchRef = doc(db, 'matchs', match.id);
        await updateDoc(matchRef, {
          championnatId: regionaleM2Id,
        });
        console.log(`✅ ${match.equipeDomicile} vs ${match.equipeExterieur} -> championnatId ajouté`);
        updateCount++;
      } catch (error) {
        console.error(`❌ Erreur pour ${match.equipeDomicile} vs ${match.equipeExterieur}:`, error);
        errorCount++;
      }
    }

    console.log(`\n✅ ${updateCount} matchs mis à jour`);
    if (errorCount > 0) {
      console.log(`⚠️  ${errorCount} erreurs rencontrées`);
    }

    console.log('\n🎉 Migration terminée avec succès !');
    console.log(`📋 Championnat ID utilisé: ${regionaleM2Id}`);
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    throw error;
  }
}

// Exécuter la migration
addChampionnatToMatchs()
  .then(() => {
    console.log('\n✅ Script terminé');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale:', error);
    process.exit(1);
  });
