// Script to add label and ordre fields to Le Crès championships
// Run with: npx tsx scripts/migration/add-label-ordre-to-cres-championships.ts

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';

// Le Crès Firebase config
const cresConfig = {
  apiKey: 'AIzaSyDPcdJ-vNfDNJIyGM1Y0Z-lQwdQXxOe25Q',
  authDomain: 'le-cres-vb.firebaseapp.com',
  projectId: 'le-cres-vb',
  storageBucket: 'le-cres-vb.firebasestorage.app',
  messagingSenderId: '260787633154',
  appId: '1:260787633154:web:cc1b0ab95c74ef7e41d7d2',
  measurementId: 'G-HFV05L41VZ',
};

// Initialize Firebase for Le Crès
const cresApp = initializeApp(cresConfig, 'cres');
const db = getFirestore(cresApp);

// Mapping des championnats avec leurs labels et ordres
const championnatsMappings: Record<string, { label: string; ordre: number }> = {
  'Nationale 3 F': { label: 'N3F', ordre: 1 },
  'Pré-nationale M': { label: 'PNM', ordre: 2 },
  'Pré-nationale F': { label: 'PNF', ordre: 3 },
  'Régionale 2 M': { label: 'R2M', ordre: 4 },
  'Régionale 2 F': { label: 'R2F', ordre: 5 },
  'M18 M': { label: 'M18M', ordre: 6 },
  'M18 F': { label: 'M18F', ordre: 7 },
  'CFD': { label: 'M18F', ordre: 7 },  // Alias pour M18 F
  'M15 M': { label: 'M15M', ordre: 8 },
  'MMB': { label: 'M15M', ordre: 8 },  // Alias pour M15 M
  'M15 F': { label: 'M15F', ordre: 9 },
  'MFD': { label: 'M15F', ordre: 9 },  // Alias pour M15 F
  'M13 Mixte': { label: 'M13 Mixte', ordre: 10 },
  'BMB': { label: 'M13 Mixte', ordre: 10 },  // Alias pour M13 Mixte
  'M13 F': { label: 'M13F', ordre: 11 },
  'BFC': { label: 'M13F', ordre: 11 },  // Alias pour M13 F
};

async function main() {
  console.log('🔄 Mise à jour des championnats Le Crès...\n');

  // Get all championships
  const championnatsRef = collection(db, 'championnats');
  const championnatsSnapshot = await getDocs(championnatsRef);

  if (championnatsSnapshot.empty) {
    console.log('❌ Aucun championnat trouvé');
    return;
  }

  console.log(`📦 ${championnatsSnapshot.size} championnat(s) trouvé(s)\n`);

  let updatedCount = 0;

  for (const docSnapshot of championnatsSnapshot.docs) {
    const data = docSnapshot.data();
    const nom = data.nom;
    const championnatId = docSnapshot.id;

    const mapping = championnatsMappings[nom];

    if (mapping) {
      const championnatRef = doc(db, 'championnats', championnatId);
      await updateDoc(championnatRef, {
        label: mapping.label,
        ordre: mapping.ordre
      });

      console.log(`✅ ${nom}`);
      console.log(`   ID: ${championnatId}`);
      console.log(`   Label: "${mapping.label}"`);
      console.log(`   Ordre: ${mapping.ordre}\n`);
      updatedCount++;
    } else {
      console.log(`⚠️  ${nom} - Aucun mapping trouvé, ignoré\n`);
    }
  }

  console.log(`🎉 ${updatedCount} championnat(s) mis à jour !`);
}

main().catch((err) => console.error(err));
