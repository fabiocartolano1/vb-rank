import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';

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

interface Equipe {
  id: string;
  nom: string;
  ville?: string;
  logoUrl?: string;
}

interface Classement {
  id: string;
  rang: number;
  equipe: string;
  equipeId?: string;
  points: number;
  joues: number;
  gagnes: number;
  perdus: number;
  setsPour: number;
  setsContre: number;
}

async function mergeClassementToEquipes() {
  console.log('🔄 Fusion des collections classement et equipes...\n');

  try {
    // 1. Récupérer toutes les équipes
    console.log('📥 Récupération des équipes...');
    const equipesSnapshot = await getDocs(collection(db, 'equipes'));
    const equipesByName = new Map<string, { id: string; data: any }>();

    equipesSnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      equipesByName.set(data.nom, { id: docSnap.id, data });
    });

    console.log(`✅ ${equipesByName.size} équipes trouvées\n`);

    // 2. Récupérer toutes les entrées de classement
    console.log('📥 Récupération du classement...');
    const classementSnapshot = await getDocs(collection(db, 'classement'));
    const classementEntries: Classement[] = [];

    classementSnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      classementEntries.push({
        id: docSnap.id,
        rang: data.rang,
        equipe: data.equipe,
        equipeId: data.equipeId,
        points: data.points,
        joues: data.joues,
        gagnes: data.gagnes,
        perdus: data.perdus,
        setsPour: data.setsPour,
        setsContre: data.setsContre,
      });
    });

    console.log(`✅ ${classementEntries.length} entrées de classement trouvées\n`);

    // 3. Fusionner les données
    console.log('🔄 Fusion des données...');
    let updateCount = 0;
    let errorCount = 0;

    for (const classementEntry of classementEntries) {
      const equipeInfo = equipesByName.get(classementEntry.equipe);

      if (equipeInfo) {
        try {
          const equipeRef = doc(db, 'equipes', equipeInfo.id);
          await updateDoc(equipeRef, {
            rang: classementEntry.rang,
            points: classementEntry.points,
            joues: classementEntry.joues,
            gagnes: classementEntry.gagnes,
            perdus: classementEntry.perdus,
            setsPour: classementEntry.setsPour,
            setsContre: classementEntry.setsContre,
          });
          console.log(`✅ Mise à jour: ${classementEntry.equipe} (rang ${classementEntry.rang})`);
          updateCount++;
        } catch (error) {
          console.error(`❌ Erreur pour ${classementEntry.equipe}:`, error);
          errorCount++;
        }
      } else {
        console.warn(`⚠️  Équipe non trouvée: ${classementEntry.equipe}`);
        errorCount++;
      }
    }

    console.log(`\n✅ ${updateCount} équipes mises à jour`);
    if (errorCount > 0) {
      console.log(`⚠️  ${errorCount} erreurs rencontrées`);
    }

    // 4. Supprimer l'ancienne collection classement
    console.log('\n🗑️  Suppression de l\'ancienne collection classement...');
    let deleteCount = 0;
    for (const entry of classementEntries) {
      try {
        await deleteDoc(doc(db, 'classement', entry.id));
        deleteCount++;
      } catch (error) {
        console.error(`❌ Erreur lors de la suppression de ${entry.id}:`, error);
      }
    }
    console.log(`✅ ${deleteCount} documents supprimés de la collection classement`);

    console.log('\n🎉 Migration terminée avec succès !');
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    throw error;
  }
}

// Exécuter la migration
mergeClassementToEquipes()
  .then(() => {
    console.log('\n✅ Script terminé');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale:', error);
    process.exit(1);
  });
