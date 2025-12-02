import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';

// Importer l'environnement FUFC
const fufcEnv = require('../../src/environments/environment.fufc');

// Initialiser Firebase pour FUFC
const fufcApp = initializeApp(fufcEnv.environment.firebase, 'fufc');
const db = getFirestore(fufcApp);

async function fixFufcEquipes() {
  try {
    console.log('🔧 Correction des équipes FUFC...\n');

    // Récupérer l'ID du championnat
    const championnatsRef = collection(db, 'championnats');
    const championnatsSnapshot = await getDocs(championnatsRef);

    if (championnatsSnapshot.empty) {
      console.log('❌ Aucun championnat trouvé. Créez d\'abord un championnat.');
      return;
    }

    const championnatId = championnatsSnapshot.docs[0].id;
    const championnatNom = championnatsSnapshot.docs[0].data().nom;
    console.log(`✅ Utilisation du championnat: ${championnatNom} (ID: ${championnatId})\n`);

    // Récupérer les équipes
    const equipesRef = collection(db, 'equipes');
    const equipesSnapshot = await getDocs(equipesRef);

    if (equipesSnapshot.empty) {
      console.log('❌ Aucune équipe trouvée');
      return;
    }

    console.log(`📦 ${equipesSnapshot.size} équipe(s) à corriger...\n`);

    let correctedCount = 0;

    for (const docSnapshot of equipesSnapshot.docs) {
      const data = docSnapshot.data();
      const docId = docSnapshot.id;

      console.log(`🔄 Correction de: ${docId}`);

      // Mapper les anciens champs vers les nouveaux
      const updatedData: any = {
        championnatId: championnatId,
        nom: data.team || docId, // Utiliser team ou l'ID du document
        rang: data.rank || 0,
        points: data.points || 0,
        joues: data.played || 0,
        gagnes: data.wins || 0,
        perdus: data.losses || 0,
        nuls: data.draws || 0,
        setsPour: data.goals_for || 0,
        setsContre: data.goals_against || 0,
        logoUrl: '' // Pas de logo pour le moment
      };

      console.log(`   Nom: ${updatedData.nom}`);
      console.log(`   Rang: ${updatedData.rang}`);
      console.log(`   Points: ${updatedData.points}`);

      // Mettre à jour le document
      const docRef = doc(db, 'equipes', docId);
      await updateDoc(docRef, updatedData);

      correctedCount++;
      console.log(`   ✅ Corrigé\n`);
    }

    console.log(`\n🎉 ${correctedCount} équipe(s) corrigée(s) avec succès !`);
    console.log(`   ChampionnatId attribué: ${championnatId}`);

  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  }
}

// Exécuter la correction
fixFufcEquipes()
  .then(() => {
    console.log('\n✅ Script terminé');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur:', error);
    process.exit(1);
  });
