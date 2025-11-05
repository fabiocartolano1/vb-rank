import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

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
  nom: string;
  logoUrl: string;
  championnatId: string;
  rang: number;
  points: number;
  joues: number;
  gagnes: number;
  perdus: number;
  setsPour: number;
  setsContre: number;
}

interface Match {
  championnatId: string;
  journee: number;
  date: string;
  heure?: string;
  equipeDomicile: string;
  equipeExterieur: string;
  scoreDomicile?: number;
  scoreExterieur?: number;
  detailSets?: string[];
  statut: 'termine' | 'a_venir';
}

// Données du classement Régionale 2 F (scraped from the URL)
const equipes: Equipe[] = [
  { nom: 'M.J.C. COURSAN', logoUrl: 'https://ui-avatars.com/api/?name=MC&background=1e40af&color=fff&size=128&bold=true&font-size=0.5', championnatId: 'regionale-2-f', rang: 1, points: 11, joues: 4, gagnes: 4, perdus: 0, setsPour: 12, setsContre: 2 },
  { nom: 'MENDE LOZERE VOLLEY-BALL', logoUrl: 'https://ui-avatars.com/api/?name=ML&background=16a34a&color=fff&size=128&bold=true&font-size=0.5', championnatId: 'regionale-2-f', rang: 2, points: 9, joues: 3, gagnes: 3, perdus: 0, setsPour: 9, setsContre: 1 },
  { nom: 'AS.SP. V.B MAUGUIO 2', logoUrl: 'https://ui-avatars.com/api/?name=AM&background=dc2626&color=fff&size=128&bold=true&font-size=0.5', championnatId: 'regionale-2-f', rang: 3, points: 9, joues: 4, gagnes: 3, perdus: 1, setsPour: 10, setsContre: 3 },
  { nom: 'NIMES VOLLEY-BALL 2', logoUrl: 'https://ui-avatars.com/api/?name=NV&background=ea580c&color=fff&size=128&bold=true&font-size=0.5', championnatId: 'regionale-2-f', rang: 4, points: 9, joues: 4, gagnes: 3, perdus: 1, setsPour: 9, setsContre: 3 },
  { nom: 'PERPIGNAN ROUSSILLON V.B 2', logoUrl: 'https://ui-avatars.com/api/?name=PR&background=7c3aed&color=fff&size=128&bold=true&font-size=0.5', championnatId: 'regionale-2-f', rang: 5, points: 9, joues: 4, gagnes: 3, perdus: 1, setsPour: 9, setsContre: 4 },
  { nom: 'VOLLEY BALL GENERAC', logoUrl: 'https://ui-avatars.com/api/?name=VG&background=0891b2&color=fff&size=128&bold=true&font-size=0.5', championnatId: 'regionale-2-f', rang: 6, points: 9, joues: 4, gagnes: 3, perdus: 1, setsPour: 10, setsContre: 5 },
  { nom: 'MONTPELLIER CASTELNAU V.U.C', logoUrl: 'https://ui-avatars.com/api/?name=MC&background=c026d3&color=fff&size=128&bold=true&font-size=0.5', championnatId: 'regionale-2-f', rang: 7, points: 7, joues: 4, gagnes: 2, perdus: 2, setsPour: 9, setsContre: 7 },
  { nom: 'SAINT-GELY VOLLEY-BALL 2', logoUrl: 'https://ui-avatars.com/api/?name=SG&background=ca8a04&color=fff&size=128&bold=true&font-size=0.5', championnatId: 'regionale-2-f', rang: 8, points: 6, joues: 3, gagnes: 2, perdus: 1, setsPour: 6, setsContre: 3 },
  { nom: 'LE CRES VOLLEY-BALL 3', logoUrl: 'https://ui-avatars.com/api/?name=LC&background=059669&color=fff&size=128&bold=true&font-size=0.5', championnatId: 'regionale-2-f', rang: 9, points: 6, joues: 4, gagnes: 2, perdus: 2, setsPour: 7, setsContre: 7 },
  { nom: 'LATTES ASPTT MONTPELLIER V.A.C 4', logoUrl: 'https://ui-avatars.com/api/?name=LA&background=be123c&color=fff&size=128&bold=true&font-size=0.5', championnatId: 'regionale-2-f', rang: 10, points: 6, joues: 4, gagnes: 2, perdus: 2, setsPour: 7, setsContre: 7 },
  { nom: 'ASLJCROIX ARGENT MONTPELLIER 3', logoUrl: 'https://ui-avatars.com/api/?name=AA&background=8b5cf6&color=fff&size=128&bold=true&font-size=0.5', championnatId: 'regionale-2-f', rang: 11, points: 6, joues: 4, gagnes: 2, perdus: 2, setsPour: 7, setsContre: 7 },
  { nom: 'VOLLEY BALL ST ESTEVE', logoUrl: 'https://ui-avatars.com/api/?name=VE&background=06b6d4&color=fff&size=128&bold=true&font-size=0.5', championnatId: 'regionale-2-f', rang: 12, points: 6, joues: 4, gagnes: 2, perdus: 2, setsPour: 7, setsContre: 7 },
  { nom: 'SETE VOLLEY-BALL CLUB', logoUrl: 'https://ui-avatars.com/api/?name=SV&background=f59e0b&color=fff&size=128&bold=true&font-size=0.5', championnatId: 'regionale-2-f', rang: 13, points: 0, joues: 0, gagnes: 0, perdus: 0, setsPour: 0, setsContre: 0 },
  { nom: 'ALES AGGLO VOLLEY BALL', logoUrl: 'https://ui-avatars.com/api/?name=AA&background=ec4899&color=fff&size=128&bold=true&font-size=0.5', championnatId: 'regionale-2-f', rang: 14, points: 0, joues: 0, gagnes: 0, perdus: 0, setsPour: 0, setsContre: 0 },
  { nom: 'NIMES VOLLEY-BALL 3', logoUrl: 'https://ui-avatars.com/api/?name=NV&background=10b981&color=fff&size=128&bold=true&font-size=0.5', championnatId: 'regionale-2-f', rang: 15, points: 0, joues: 0, gagnes: 0, perdus: 0, setsPour: 0, setsContre: 0 },
  { nom: 'VOLLEY-CLUB VENDROIS', logoUrl: 'https://ui-avatars.com/api/?name=VV&background=3b82f6&color=fff&size=128&bold=true&font-size=0.5', championnatId: 'regionale-2-f', rang: 16, points: -3, joues: 0, gagnes: 0, perdus: 0, setsPour: 0, setsContre: 0 },
];

// Matchs pour Régionale 2 F (à compléter selon les données disponibles)
// Pour l'instant je mets quelques matchs fictifs pour la structure
const matchs: Match[] = [
  // Journée 1 - 20/09/2025
  { championnatId: 'regionale-2-f', journee: 1, date: '2025-09-20', heure: '18:00', equipeDomicile: 'M.J.C. COURSAN', equipeExterieur: 'VOLLEY BALL GENERAC', scoreDomicile: 3, scoreExterieur: 1, detailSets: ['25:20', '25:22', '23:25', '25:18'], statut: 'termine' },
  { championnatId: 'regionale-2-f', journee: 1, date: '2025-09-20', heure: '19:00', equipeDomicile: 'MENDE LOZERE VOLLEY-BALL', equipeExterieur: 'SAINT-GELY VOLLEY-BALL 2', scoreDomicile: 3, scoreExterieur: 0, detailSets: ['25:18', '25:20', '25:19'], statut: 'termine' },
  { championnatId: 'regionale-2-f', journee: 1, date: '2025-09-20', heure: '17:00', equipeDomicile: 'AS.SP. V.B MAUGUIO 2', equipeExterieur: 'LATTES ASPTT MONTPELLIER V.A.C 4', scoreDomicile: 3, scoreExterieur: 0, detailSets: ['25:22', '25:19', '25:21'], statut: 'termine' },
  { championnatId: 'regionale-2-f', journee: 1, date: '2025-09-20', heure: '16:00', equipeDomicile: 'NIMES VOLLEY-BALL 2', equipeExterieur: 'LE CRES VOLLEY-BALL 3', scoreDomicile: 3, scoreExterieur: 0, detailSets: ['25:20', '25:18', '25:22'], statut: 'termine' },
  { championnatId: 'regionale-2-f', journee: 1, date: '2025-09-20', heure: '20:00', equipeDomicile: 'PERPIGNAN ROUSSILLON V.B 2', equipeExterieur: 'ASLJCROIX ARGENT MONTPELLIER 3', scoreDomicile: 3, scoreExterieur: 1, detailSets: ['25:19', '23:25', '25:20', '25:18'], statut: 'termine' },
  { championnatId: 'regionale-2-f', journee: 1, date: '2025-09-20', heure: '17:30', equipeDomicile: 'MONTPELLIER CASTELNAU V.U.C', equipeExterieur: 'VOLLEY BALL ST ESTEVE', scoreDomicile: 3, scoreExterieur: 2, detailSets: ['25:20', '20:25', '25:22', '23:25', '15:12'], statut: 'termine' },

  // Journée 2 - 27/09/2025
  { championnatId: 'regionale-2-f', journee: 2, date: '2025-09-27', heure: '20:00', equipeDomicile: 'VOLLEY BALL GENERAC', equipeExterieur: 'MONTPELLIER CASTELNAU V.U.C', statut: 'a_venir' },
  { championnatId: 'regionale-2-f', journee: 2, date: '2025-09-28', heure: '11:00', equipeDomicile: 'VOLLEY BALL ST ESTEVE', equipeExterieur: 'PERPIGNAN ROUSSILLON V.B 2', statut: 'a_venir' },
  { championnatId: 'regionale-2-f', journee: 2, date: '2025-09-27', heure: '17:00', equipeDomicile: 'ASLJCROIX ARGENT MONTPELLIER 3', equipeExterieur: 'NIMES VOLLEY-BALL 2', statut: 'a_venir' },
  { championnatId: 'regionale-2-f', journee: 2, date: '2025-09-27', heure: '20:00', equipeDomicile: 'LE CRES VOLLEY-BALL 3', equipeExterieur: 'AS.SP. V.B MAUGUIO 2', statut: 'a_venir' },
  { championnatId: 'regionale-2-f', journee: 2, date: '2025-09-27', heure: '17:30', equipeDomicile: 'LATTES ASPTT MONTPELLIER V.A.C 4', equipeExterieur: 'MENDE LOZERE VOLLEY-BALL', statut: 'a_venir' },
  { championnatId: 'regionale-2-f', journee: 2, date: '2025-09-27', heure: '17:00', equipeDomicile: 'SAINT-GELY VOLLEY-BALL 2', equipeExterieur: 'M.J.C. COURSAN', statut: 'a_venir' },

  // Journée 3 - 04/10/2025
  { championnatId: 'regionale-2-f', journee: 3, date: '2025-10-04', heure: '17:30', equipeDomicile: 'SAINT-GELY VOLLEY-BALL 2', equipeExterieur: 'LATTES ASPTT MONTPELLIER V.A.C 4', statut: 'a_venir' },
  { championnatId: 'regionale-2-f', journee: 3, date: '2025-10-04', heure: '18:00', equipeDomicile: 'M.J.C. COURSAN', equipeExterieur: 'LE CRES VOLLEY-BALL 3', statut: 'a_venir' },
  { championnatId: 'regionale-2-f', journee: 3, date: '2025-10-04', heure: '19:00', equipeDomicile: 'MENDE LOZERE VOLLEY-BALL', equipeExterieur: 'ASLJCROIX ARGENT MONTPELLIER 3', statut: 'a_venir' },
  { championnatId: 'regionale-2-f', journee: 3, date: '2025-10-04', heure: '17:00', equipeDomicile: 'AS.SP. V.B MAUGUIO 2', equipeExterieur: 'VOLLEY BALL ST ESTEVE', statut: 'a_venir' },
  { championnatId: 'regionale-2-f', journee: 3, date: '2025-10-04', heure: '18:00', equipeDomicile: 'NIMES VOLLEY-BALL 2', equipeExterieur: 'VOLLEY BALL GENERAC', statut: 'a_venir' },
  { championnatId: 'regionale-2-f', journee: 3, date: '2025-10-04', heure: '20:00', equipeDomicile: 'PERPIGNAN ROUSSILLON V.B 2', equipeExterieur: 'MONTPELLIER CASTELNAU V.U.C', statut: 'a_venir' },

  // Ajouter les autres journées selon les données disponibles...
];

async function importRegionale2F() {
  try {
    console.log('🏐 Import Régionale 2 F\n');

    // 1. Importer les équipes
    console.log('📥 Importation des équipes...');
    const equipesMap = new Map<string, string>();

    for (const equipe of equipes) {
      const docRef = await addDoc(collection(db, 'equipes'), equipe);
      equipesMap.set(equipe.nom, docRef.id);
      console.log(`✅ ${equipe.nom} (rang ${equipe.rang}) - ${equipe.points} pts`);
    }

    console.log(`\n✅ ${equipes.length} équipes importées\n`);

    // 2. Importer les matchs avec les IDs d'équipes
    console.log('📥 Importation des matchs...');
    let matchCount = 0;

    for (const match of matchs) {
      const matchWithIds = {
        ...match,
        equipeDomicileId: equipesMap.get(match.equipeDomicile),
        equipeExterieurId: equipesMap.get(match.equipeExterieur),
      };

      await addDoc(collection(db, 'matchs'), matchWithIds);
      matchCount++;

      if (matchCount % 5 === 0) {
        console.log(`  ${matchCount}/${matchs.length} matchs importés...`);
      }
    }

    console.log(`\n✅ ${matchs.length} matchs importés`);

    console.log('\n🎉 Import terminé avec succès !');
    console.log(`\n📊 Résumé:`);
    console.log(`   - ${equipes.length} équipes`);
    console.log(`   - ${matchs.length} matchs`);
    console.log(`   - Championnat: regionale-2-f`);
  } catch (error) {
    console.error('❌ Erreur lors de l\'import:', error);
    throw error;
  }
}

importRegionale2F()
  .then(() => {
    console.log('\n✅ Script terminé');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale:', error);
    process.exit(1);
  });
