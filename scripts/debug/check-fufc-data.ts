import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

// Importer l'environnement FUFC
const fufcEnv = require('../../src/environments/environment.fufc');

// Initialiser Firebase pour FUFC
const fufcApp = initializeApp(fufcEnv.environment.firebase, 'fufc');
const db = getFirestore(fufcApp);

async function checkFufcData() {
  try {
    console.log('🔍 Vérification des données FUFC...\n');

    // Vérifier les championnats
    console.log('📋 CHAMPIONNATS:');
    const championnatsRef = collection(db, 'championnats');
    const championnatsSnapshot = await getDocs(championnatsRef);

    if (championnatsSnapshot.empty) {
      console.log('❌ Aucun championnat trouvé\n');
    } else {
      console.log(`✅ ${championnatsSnapshot.size} championnat(s) trouvé(s):`);
      championnatsSnapshot.forEach(doc => {
        const data = doc.data();
        console.log(`   - ID: ${doc.id}, Nom: ${data.nom}`);
      });
      console.log('');
    }

    // Vérifier les équipes
    console.log('👥 ÉQUIPES:');
    const equipesRef = collection(db, 'equipes');
    const equipesSnapshot = await getDocs(equipesRef);

    if (equipesSnapshot.empty) {
      console.log('❌ Aucune équipe trouvée\n');
    } else {
      console.log(`✅ ${equipesSnapshot.size} équipe(s) trouvée(s):`);
      equipesSnapshot.forEach(doc => {
        const data = doc.data();
        console.log(`   - ID: ${doc.id}`);
        console.log(`     Nom: ${data.nom}`);
        console.log(`     ChampionnatId: ${data.championnatId || 'NON DÉFINI ❌'}`);
        console.log(`     Rang: ${data.rang}`);
        console.log(`     Points: ${data.points}`);
        console.log('');
      });
    }

    // Résumé
    console.log('\n📊 RÉSUMÉ:');
    console.log(`   Championnats: ${championnatsSnapshot.size}`);
    console.log(`   Équipes: ${equipesSnapshot.size}`);

    // Vérifier si les équipes ont des championnatId qui correspondent
    if (!championnatsSnapshot.empty && !equipesSnapshot.empty) {
      const championnatIds = new Set(championnatsSnapshot.docs.map(d => d.id));
      const equipesWithoutChampionnat = equipesSnapshot.docs.filter(d => {
        const championnatId = d.data().championnatId;
        return !championnatId || !championnatIds.has(championnatId);
      });

      if (equipesWithoutChampionnat.length > 0) {
        console.log(`\n⚠️  ATTENTION: ${equipesWithoutChampionnat.length} équipe(s) ont un championnatId invalide ou manquant:`);
        equipesWithoutChampionnat.forEach(d => {
          console.log(`   - ${d.data().nom}: championnatId = "${d.data().championnatId || 'undefined'}"`);
        });
      } else {
        console.log('\n✅ Toutes les équipes ont un championnatId valide');
      }
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  }
}

// Exécuter la vérification
checkFufcData()
  .then(() => {
    console.log('\n✅ Vérification terminée');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur:', error);
    process.exit(1);
  });
