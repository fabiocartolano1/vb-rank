import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc, addDoc } from 'firebase/firestore';

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

async function addChampionnatToEquipes() {
  console.log('🏆 Ajout du championnat aux équipes...\n');

  try {
    // 1. Créer le championnat "Régionale 2 M" s'il n'existe pas
    console.log('📥 Vérification du championnat "Régionale 2 M"...');

    const championnatsSnapshot = await getDocs(collection(db, 'championnats'));
    let regionaleM2Id: string | null = null;

    // Chercher si le championnat existe déjà
    championnatsSnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.nom === 'Régionale 2 M' || data.equipe === 'Régionale 2 M') {
        regionaleM2Id = docSnap.id;
        console.log(`✅ Championnat "Régionale 2 M" trouvé avec l'ID: ${regionaleM2Id}`);
      }
    });

    // Si le championnat n'existe pas, le créer
    if (!regionaleM2Id) {
      console.log('➕ Création du championnat "Régionale 2 M"...');
      const championnatRef = await addDoc(collection(db, 'championnats'), {
        nom: 'Régionale 2 M',
        equipe: 'Régionale 2 M',
        url: 'https://www.ffvbbeach.org/ffvbapp/resu/vbspo_calendrier.php?saison=2024/2025&codent=HERLR2HMD2',
      });
      regionaleM2Id = championnatRef.id;
      console.log(`✅ Championnat créé avec l'ID: ${regionaleM2Id}`);
    }

    // 2. Récupérer toutes les équipes
    console.log('\n📥 Récupération des équipes...');
    const equipesSnapshot = await getDocs(collection(db, 'equipes'));
    const equipes: Array<{ id: string; nom: string }> = [];

    equipesSnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      equipes.push({
        id: docSnap.id,
        nom: data.nom,
      });
    });

    console.log(`✅ ${equipes.length} équipes trouvées\n`);

    // 3. Mettre à jour toutes les équipes avec le championnatId
    console.log('🔄 Mise à jour des équipes...');
    let updateCount = 0;
    let errorCount = 0;

    for (const equipe of equipes) {
      try {
        const equipeRef = doc(db, 'equipes', equipe.id);
        await updateDoc(equipeRef, {
          championnatId: regionaleM2Id,
        });
        console.log(`✅ ${equipe.nom} -> championnatId ajouté`);
        updateCount++;
      } catch (error) {
        console.error(`❌ Erreur pour ${equipe.nom}:`, error);
        errorCount++;
      }
    }

    console.log(`\n✅ ${updateCount} équipes mises à jour`);
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
addChampionnatToEquipes()
  .then(() => {
    console.log('\n✅ Script terminé');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale:', error);
    process.exit(1);
  });
