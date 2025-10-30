import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';

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

async function linkEquipesIds() {
  console.log('🔗 Liaison des IDs des équipes...\n');

  try {
    // 1. Récupérer toutes les équipes
    console.log('📥 Récupération des équipes...');
    const equipesSnapshot = await getDocs(collection(db, 'equipes'));
    const equipes: Equipe[] = [];
    const equipesByName = new Map<string, string>(); // nom -> id

    equipesSnapshot.forEach((doc) => {
      const data = doc.data();
      const equipe: Equipe = {
        id: doc.id,
        nom: data.nom,
        ville: data.ville,
        logoUrl: data.logoUrl,
      };
      equipes.push(equipe);
      equipesByName.set(equipe.nom, equipe.id);
    });

    console.log(`✅ ${equipes.length} équipes trouvées\n`);

    // 2. Mettre à jour les matchs
    console.log('🏐 Mise à jour des matchs...');
    const matchsSnapshot = await getDocs(collection(db, 'matchs'));
    let matchsUpdated = 0;

    for (const matchDoc of matchsSnapshot.docs) {
      const matchData = matchDoc.data();
      const updates: any = {};

      // Trouver l'ID de l'équipe domicile
      if (matchData.equipeDomicile) {
        const domicileId = equipesByName.get(matchData.equipeDomicile);
        if (domicileId) {
          updates.equipeDomicileId = domicileId;
        } else {
          console.warn(`⚠️  Équipe domicile non trouvée: ${matchData.equipeDomicile}`);
        }
      }

      // Trouver l'ID de l'équipe extérieur
      if (matchData.equipeExterieur) {
        const exterieurId = equipesByName.get(matchData.equipeExterieur);
        if (exterieurId) {
          updates.equipeExterieurId = exterieurId;
        } else {
          console.warn(`⚠️  Équipe extérieur non trouvée: ${matchData.equipeExterieur}`);
        }
      }

      // Mettre à jour le document si des IDs ont été trouvés
      if (Object.keys(updates).length > 0) {
        await updateDoc(doc(db, 'matchs', matchDoc.id), updates);
        matchsUpdated++;
      }
    }

    console.log(`✅ ${matchsUpdated} matchs mis à jour\n`);

    // 3. Mettre à jour le classement
    console.log('📊 Mise à jour du classement...');
    const classementSnapshot = await getDocs(collection(db, 'classement'));
    let classementUpdated = 0;

    for (const classementDoc of classementSnapshot.docs) {
      const classementData = classementDoc.data();
      const updates: any = {};

      // Trouver l'ID de l'équipe
      if (classementData.equipe) {
        const equipeId = equipesByName.get(classementData.equipe);
        if (equipeId) {
          updates.equipeId = equipeId;
        } else {
          console.warn(`⚠️  Équipe non trouvée dans classement: ${classementData.equipe}`);
        }
      }

      // Mettre à jour le document si un ID a été trouvé
      if (Object.keys(updates).length > 0) {
        await updateDoc(doc(db, 'classement', classementDoc.id), updates);
        classementUpdated++;
      }
    }

    console.log(`✅ ${classementUpdated} entrées de classement mises à jour\n`);

    console.log('✨ Liaison des IDs terminée avec succès!');
    console.log('\n📋 Résumé:');
    console.log(`  - Équipes: ${equipes.length}`);
    console.log(`  - Matchs mis à jour: ${matchsUpdated}`);
    console.log(`  - Classements mis à jour: ${classementUpdated}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de la liaison:', error);
    process.exit(1);
  }
}

// Exécuter le script
linkEquipesIds();
