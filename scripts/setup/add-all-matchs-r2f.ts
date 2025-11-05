import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query, where, deleteDoc, doc } from 'firebase/firestore';
import { firebaseConfig } from '../config/firebase-config';

// Initialiser Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

interface Match {
  championnatId: string;
  journee: number;
  date: string;
  heure?: string;
  equipeDomicile: string;
  equipeDomicileId?: string;
  equipeExterieur: string;
  equipeExterieurId?: string;
  scoreDomicile?: number;
  scoreExterieur?: number;
  detailSets?: string[];
  statut: 'termine' | 'a_venir';
}

// Tous les matchs pour les 15 journées de Régionale 2 F
const allMatchs: Match[] = [
  // Journée 4 - 18/10/2025
  { championnatId: 'regionale-2-f', journee: 4, date: '2025-10-18', heure: '18:00', equipeDomicile: 'VOLLEY BALL GENERAC', equipeExterieur: 'LE CRES VOLLEY-BALL 3', statut: 'a_venir' },
  { championnatId: 'regionale-2-f', journee: 4, date: '2025-10-18', heure: '20:00', equipeDomicile: 'MONTPELLIER CASTELNAU V.U.C', equipeExterieur: 'NIMES VOLLEY-BALL 2', statut: 'a_venir' },
  { championnatId: 'regionale-2-f', journee: 4, date: '2025-10-18', heure: '17:00', equipeDomicile: 'PERPIGNAN ROUSSILLON V.B 2', equipeExterieur: 'AS.SP. V.B MAUGUIO 2', statut: 'a_venir' },
  { championnatId: 'regionale-2-f', journee: 4, date: '2025-10-18', heure: '20:00', equipeDomicile: 'VOLLEY BALL ST ESTEVE', equipeExterieur: 'MENDE LOZERE VOLLEY-BALL', statut: 'a_venir' },
  { championnatId: 'regionale-2-f', journee: 4, date: '2025-10-18', heure: '17:30', equipeDomicile: 'ASLJCROIX ARGENT MONTPELLIER 3', equipeExterieur: 'M.J.C. COURSAN', statut: 'a_venir' },
  { championnatId: 'regionale-2-f', journee: 4, date: '2025-10-18', heure: '18:00', equipeDomicile: 'LATTES ASPTT MONTPELLIER V.A.C 4', equipeExterieur: 'SAINT-GELY VOLLEY-BALL 2', statut: 'a_venir' },

  // Journée 5 - 15/11/2025
  { championnatId: 'regionale-2-f', journee: 5, date: '2025-11-15', heure: '17:00', equipeDomicile: 'LATTES ASPTT MONTPELLIER V.A.C 4', equipeExterieur: 'ASLJCROIX ARGENT MONTPELLIER 3', statut: 'a_venir' },
  { championnatId: 'regionale-2-f', journee: 5, date: '2025-11-15', heure: '18:00', equipeDomicile: 'SAINT-GELY VOLLEY-BALL 2', equipeExterieur: 'VOLLEY BALL ST ESTEVE', statut: 'a_venir' },
  { championnatId: 'regionale-2-f', journee: 5, date: '2025-11-15', heure: '19:00', equipeDomicile: 'M.J.C. COURSAN', equipeExterieur: 'PERPIGNAN ROUSSILLON V.B 2', statut: 'a_venir' },
  { championnatId: 'regionale-2-f', journee: 5, date: '2025-11-15', heure: '18:00', equipeDomicile: 'MENDE LOZERE VOLLEY-BALL', equipeExterieur: 'MONTPELLIER CASTELNAU V.U.C', statut: 'a_venir' },
  { championnatId: 'regionale-2-f', journee: 5, date: '2025-11-15', heure: '17:00', equipeDomicile: 'AS.SP. V.B MAUGUIO 2', equipeExterieur: 'VOLLEY BALL GENERAC', statut: 'a_venir' },
  { championnatId: 'regionale-2-f', journee: 5, date: '2025-11-15', heure: '16:00', equipeDomicile: 'NIMES VOLLEY-BALL 2', equipeExterieur: 'LE CRES VOLLEY-BALL 3', statut: 'a_venir' },

  // Journée 6 - 22/11/2025
  { championnatId: 'regionale-2-f', journee: 6, date: '2025-11-22', heure: '16:00', equipeDomicile: 'LE CRES VOLLEY-BALL 3', equipeExterieur: 'MENDE LOZERE VOLLEY-BALL', statut: 'a_venir' },
  { championnatId: 'regionale-2-f', journee: 6, date: '2025-11-22', heure: '17:00', equipeDomicile: 'VOLLEY BALL GENERAC', equipeExterieur: 'M.J.C. COURSAN', statut: 'a_venir' },
  { championnatId: 'regionale-2-f', journee: 6, date: '2025-11-22', heure: '20:00', equipeDomicile: 'MONTPELLIER CASTELNAU V.U.C', equipeExterieur: 'SAINT-GELY VOLLEY-BALL 2', statut: 'a_venir' },
  { championnatId: 'regionale-2-f', journee: 6, date: '2025-11-22', heure: '17:00', equipeDomicile: 'PERPIGNAN ROUSSILLON V.B 2', equipeExterieur: 'LATTES ASPTT MONTPELLIER V.A.C 4', statut: 'a_venir' },
  { championnatId: 'regionale-2-f', journee: 6, date: '2025-11-22', heure: '18:00', equipeDomicile: 'VOLLEY BALL ST ESTEVE', equipeExterieur: 'ASLJCROIX ARGENT MONTPELLIER 3', statut: 'a_venir' },
  { championnatId: 'regionale-2-f', journee: 6, date: '2025-11-22', heure: '17:00', equipeDomicile: 'AS.SP. V.B MAUGUIO 2', equipeExterieur: 'NIMES VOLLEY-BALL 2', statut: 'a_venir' },

  // Journée 7 - 06/12/2025
  { championnatId: 'regionale-2-f', journee: 7, date: '2025-12-06', heure: '17:30', equipeDomicile: 'LATTES ASPTT MONTPELLIER V.A.C 4', equipeExterieur: 'VOLLEY BALL ST ESTEVE', statut: 'a_venir' },
  { championnatId: 'regionale-2-f', journee: 7, date: '2025-12-06', heure: '18:00', equipeDomicile: 'SAINT-GELY VOLLEY-BALL 2', equipeExterieur: 'LE CRES VOLLEY-BALL 3', statut: 'a_venir' },
  { championnatId: 'regionale-2-f', journee: 7, date: '2025-12-06', heure: '18:00', equipeDomicile: 'M.J.C. COURSAN', equipeExterieur: 'AS.SP. V.B MAUGUIO 2', statut: 'a_venir' },
  { championnatId: 'regionale-2-f', journee: 7, date: '2025-12-06', heure: '19:00', equipeDomicile: 'MENDE LOZERE VOLLEY-BALL', equipeExterieur: 'VOLLEY BALL GENERAC', statut: 'a_venir' },
  { championnatId: 'regionale-2-f', journee: 7, date: '2025-12-06', heure: '16:00', equipeDomicile: 'NIMES VOLLEY-BALL 2', equipeExterieur: 'PERPIGNAN ROUSSILLON V.B 2', statut: 'a_venir' },
  { championnatId: 'regionale-2-f', journee: 7, date: '2025-12-07', heure: '11:00', equipeDomicile: 'ASLJCROIX ARGENT MONTPELLIER 3', equipeExterieur: 'MONTPELLIER CASTELNAU V.U.C', statut: 'a_venir' },

  // Journée 8 - 13/12/2025
  { championnatId: 'regionale-2-f', journee: 8, date: '2025-12-13', heure: '17:00', equipeDomicile: 'VOLLEY BALL GENERAC', equipeExterieur: 'SAINT-GELY VOLLEY-BALL 2', statut: 'a_venir' },
  { championnatId: 'regionale-2-f', journee: 8, date: '2025-12-13', heure: '17:00', equipeDomicile: 'LE CRES VOLLEY-BALL 3', equipeExterieur: 'ASLJCROIX ARGENT MONTPELLIER 3', statut: 'a_venir' },
  { championnatId: 'regionale-2-f', journee: 8, date: '2025-12-13', heure: '20:00', equipeDomicile: 'MONTPELLIER CASTELNAU V.U.C', equipeExterieur: 'LATTES ASPTT MONTPELLIER V.A.C 4', statut: 'a_venir' },
  { championnatId: 'regionale-2-f', journee: 8, date: '2025-12-13', heure: '17:00', equipeDomicile: 'PERPIGNAN ROUSSILLON V.B 2', equipeExterieur: 'M.J.C. COURSAN', statut: 'a_venir' },
  { championnatId: 'regionale-2-f', journee: 8, date: '2025-12-13', heure: '20:00', equipeDomicile: 'VOLLEY BALL ST ESTEVE', equipeExterieur: 'NIMES VOLLEY-BALL 2', statut: 'a_venir' },
  { championnatId: 'regionale-2-f', journee: 8, date: '2025-12-13', heure: '17:00', equipeDomicile: 'AS.SP. V.B MAUGUIO 2', equipeExterieur: 'MENDE LOZERE VOLLEY-BALL', statut: 'a_venir' },

  // Journée 9 - 10/01/2026
  { championnatId: 'regionale-2-f', journee: 9, date: '2026-01-10', heure: '17:30', equipeDomicile: 'LATTES ASPTT MONTPELLIER V.A.C 4', equipeExterieur: 'LE CRES VOLLEY-BALL 3', statut: 'a_venir' },
  { championnatId: 'regionale-2-f', journee: 9, date: '2026-01-10', heure: '18:00', equipeDomicile: 'SAINT-GELY VOLLEY-BALL 2', equipeExterieur: 'AS.SP. V.B MAUGUIO 2', statut: 'a_venir' },
  { championnatId: 'regionale-2-f', journee: 9, date: '2026-01-10', heure: '15:00', equipeDomicile: 'M.J.C. COURSAN', equipeExterieur: 'MENDE LOZERE VOLLEY-BALL', statut: 'a_venir' },
  { championnatId: 'regionale-2-f', journee: 9, date: '2026-01-10', heure: '19:00', equipeDomicile: 'NIMES VOLLEY-BALL 2', equipeExterieur: 'MONTPELLIER CASTELNAU V.U.C', statut: 'a_venir' },
  { championnatId: 'regionale-2-f', journee: 9, date: '2026-01-10', heure: '20:00', equipeDomicile: 'PERPIGNAN ROUSSILLON V.B 2', equipeExterieur: 'VOLLEY BALL GENERAC', statut: 'a_venir' },
  { championnatId: 'regionale-2-f', journee: 9, date: '2026-01-11', heure: '11:00', equipeDomicile: 'ASLJCROIX ARGENT MONTPELLIER 3', equipeExterieur: 'VOLLEY BALL ST ESTEVE', statut: 'a_venir' },

  // Journée 10 - 24/01/2026
  { championnatId: 'regionale-2-f', journee: 10, date: '2026-01-24', heure: '17:00', equipeDomicile: 'VOLLEY BALL GENERAC', equipeExterieur: 'M.J.C. COURSAN', statut: 'a_venir' },
  { championnatId: 'regionale-2-f', journee: 10, date: '2026-01-24', heure: '16:00', equipeDomicile: 'LE CRES VOLLEY-BALL 3', equipeExterieur: 'NIMES VOLLEY-BALL 2', statut: 'a_venir' },
  { championnatId: 'regionale-2-f', journee: 10, date: '2026-01-24', heure: '20:00', equipeDomicile: 'MONTPELLIER CASTELNAU V.U.C', equipeExterieur: 'ASLJCROIX ARGENT MONTPELLIER 3', statut: 'a_venir' },
  { championnatId: 'regionale-2-f', journee: 10, date: '2026-01-24', heure: '17:00', equipeDomicile: 'AS.SP. V.B MAUGUIO 2', equipeExterieur: 'LATTES ASPTT MONTPELLIER V.A.C 4', statut: 'a_venir' },
  { championnatId: 'regionale-2-f', journee: 10, date: '2026-01-24', heure: '19:00', equipeDomicile: 'MENDE LOZERE VOLLEY-BALL', equipeExterieur: 'SAINT-GELY VOLLEY-BALL 2', statut: 'a_venir' },
  { championnatId: 'regionale-2-f', journee: 10, date: '2026-01-24', heure: '20:00', equipeDomicile: 'VOLLEY BALL ST ESTEVE', equipeExterieur: 'PERPIGNAN ROUSSILLON V.B 2', statut: 'a_venir' },

  // Journée 11 - 31/01/2026
  { championnatId: 'regionale-2-f', journee: 11, date: '2026-01-31', heure: '17:30', equipeDomicile: 'LATTES ASPTT MONTPELLIER V.A.C 4', equipeExterieur: 'MENDE LOZERE VOLLEY-BALL', statut: 'a_venir' },
  { championnatId: 'regionale-2-f', journee: 11, date: '2026-01-31', heure: '17:30', equipeDomicile: 'SAINT-GELY VOLLEY-BALL 2', equipeExterieur: 'VOLLEY BALL GENERAC', statut: 'a_venir' },
  { championnatId: 'regionale-2-f', journee: 11, date: '2026-01-31', heure: '18:00', equipeDomicile: 'M.J.C. COURSAN', equipeExterieur: 'VOLLEY BALL ST ESTEVE', statut: 'a_venir' },
  { championnatId: 'regionale-2-f', journee: 11, date: '2026-01-31', heure: '16:00', equipeDomicile: 'NIMES VOLLEY-BALL 2', equipeExterieur: 'ASLJCROIX ARGENT MONTPELLIER 3', statut: 'a_venir' },
  { championnatId: 'regionale-2-f', journee: 11, date: '2026-01-31', heure: '17:00', equipeDomicile: 'PERPIGNAN ROUSSILLON V.B 2', equipeExterieur: 'LE CRES VOLLEY-BALL 3', statut: 'a_venir' },
  { championnatId: 'regionale-2-f', journee: 11, date: '2026-01-31', heure: '17:00', equipeDomicile: 'AS.SP. V.B MAUGUIO 2', equipeExterieur: 'MONTPELLIER CASTELNAU V.U.C', statut: 'a_venir' },

  // Journée 12 - 14/02/2026
  { championnatId: 'regionale-2-f', journee: 12, date: '2026-02-14', heure: '17:00', equipeDomicile: 'VOLLEY BALL GENERAC', equipeExterieur: 'LATTES ASPTT MONTPELLIER V.A.C 4', statut: 'a_venir' },
  { championnatId: 'regionale-2-f', journee: 12, date: '2026-02-14', heure: '16:00', equipeDomicile: 'LE CRES VOLLEY-BALL 3', equipeExterieur: 'M.J.C. COURSAN', statut: 'a_venir' },
  { championnatId: 'regionale-2-f', journee: 12, date: '2026-02-14', heure: '20:00', equipeDomicile: 'MONTPELLIER CASTELNAU V.U.C', equipeExterieur: 'PERPIGNAN ROUSSILLON V.B 2', statut: 'a_venir' },
  { championnatId: 'regionale-2-f', journee: 12, date: '2026-02-14', heure: '18:00', equipeDomicile: 'VOLLEY BALL ST ESTEVE', equipeExterieur: 'AS.SP. V.B MAUGUIO 2', statut: 'a_venir' },
  { championnatId: 'regionale-2-f', journee: 12, date: '2026-02-14', heure: '19:00', equipeDomicile: 'MENDE LOZERE VOLLEY-BALL', equipeExterieur: 'NIMES VOLLEY-BALL 2', statut: 'a_venir' },
  { championnatId: 'regionale-2-f', journee: 12, date: '2026-02-15', heure: '11:00', equipeDomicile: 'ASLJCROIX ARGENT MONTPELLIER 3', equipeExterieur: 'SAINT-GELY VOLLEY-BALL 2', statut: 'a_venir' },

  // Journée 13 - 14/03/2026
  { championnatId: 'regionale-2-f', journee: 13, date: '2026-03-14', heure: '17:30', equipeDomicile: 'LATTES ASPTT MONTPELLIER V.A.C 4', equipeExterieur: 'M.J.C. COURSAN', statut: 'a_venir' },
  { championnatId: 'regionale-2-f', journee: 13, date: '2026-03-14', heure: '18:00', equipeDomicile: 'SAINT-GELY VOLLEY-BALL 2', equipeExterieur: 'PERPIGNAN ROUSSILLON V.B 2', statut: 'a_venir' },
  { championnatId: 'regionale-2-f', journee: 13, date: '2026-03-14', heure: '20:00', equipeDomicile: 'MONTPELLIER CASTELNAU V.U.C', equipeExterieur: 'VOLLEY BALL ST ESTEVE', statut: 'a_venir' },
  { championnatId: 'regionale-2-f', journee: 13, date: '2026-03-14', heure: '17:00', equipeDomicile: 'AS.SP. V.B MAUGUIO 2', equipeExterieur: 'LE CRES VOLLEY-BALL 3', statut: 'a_venir' },
  { championnatId: 'regionale-2-f', journee: 13, date: '2026-03-14', heure: '16:00', equipeDomicile: 'NIMES VOLLEY-BALL 2', equipeExterieur: 'VOLLEY BALL GENERAC', statut: 'a_venir' },
  { championnatId: 'regionale-2-f', journee: 13, date: '2026-03-14', heure: '20:00', equipeDomicile: 'ASLJCROIX ARGENT MONTPELLIER 3', equipeExterieur: 'MENDE LOZERE VOLLEY-BALL', statut: 'a_venir' },

  // Journée 14 - 21/03/2026
  { championnatId: 'regionale-2-f', journee: 14, date: '2026-03-21', heure: '17:00', equipeDomicile: 'VOLLEY BALL GENERAC', equipeExterieur: 'ASLJCROIX ARGENT MONTPELLIER 3', statut: 'a_venir' },
  { championnatId: 'regionale-2-f', journee: 14, date: '2026-03-21', heure: '16:00', equipeDomicile: 'LE CRES VOLLEY-BALL 3', equipeExterieur: 'MONTPELLIER CASTELNAU V.U.C', statut: 'a_venir' },
  { championnatId: 'regionale-2-f', journee: 14, date: '2026-03-21', heure: '18:00', equipeDomicile: 'M.J.C. COURSAN', equipeExterieur: 'NIMES VOLLEY-BALL 2', statut: 'a_venir' },
  { championnatId: 'regionale-2-f', journee: 14, date: '2026-03-21', heure: '19:00', equipeDomicile: 'MENDE LOZERE VOLLEY-BALL', equipeExterieur: 'PERPIGNAN ROUSSILLON V.B 2', statut: 'a_venir' },
  { championnatId: 'regionale-2-f', journee: 14, date: '2026-03-21', heure: '18:00', equipeDomicile: 'VOLLEY BALL ST ESTEVE', equipeExterieur: 'SAINT-GELY VOLLEY-BALL 2', statut: 'a_venir' },
  { championnatId: 'regionale-2-f', journee: 14, date: '2026-03-21', heure: '17:00', equipeDomicile: 'AS.SP. V.B MAUGUIO 2', equipeExterieur: 'LATTES ASPTT MONTPELLIER V.A.C 4', statut: 'a_venir' },

  // Journée 15 - 04/04/2026
  { championnatId: 'regionale-2-f', journee: 15, date: '2026-04-04', heure: '17:30', equipeDomicile: 'LATTES ASPTT MONTPELLIER V.A.C 4', equipeExterieur: 'VOLLEY BALL GENERAC', statut: 'a_venir' },
  { championnatId: 'regionale-2-f', journee: 15, date: '2026-04-04', heure: '17:30', equipeDomicile: 'SAINT-GELY VOLLEY-BALL 2', equipeExterieur: 'M.J.C. COURSAN', statut: 'a_venir' },
  { championnatId: 'regionale-2-f', journee: 15, date: '2026-04-04', heure: '16:00', equipeDomicile: 'NIMES VOLLEY-BALL 2', equipeExterieur: 'LE CRES VOLLEY-BALL 3', statut: 'a_venir' },
  { championnatId: 'regionale-2-f', journee: 15, date: '2026-04-04', heure: '17:00', equipeDomicile: 'PERPIGNAN ROUSSILLON V.B 2', equipeExterieur: 'ASLJCROIX ARGENT MONTPELLIER 3', statut: 'a_venir' },
  { championnatId: 'regionale-2-f', journee: 15, date: '2026-04-04', heure: '20:00', equipeDomicile: 'MONTPELLIER CASTELNAU V.U.C', equipeExterieur: 'VOLLEY BALL ST ESTEVE', statut: 'a_venir' },
  { championnatId: 'regionale-2-f', journee: 15, date: '2026-04-05', heure: '11:00', equipeDomicile: 'MENDE LOZERE VOLLEY-BALL', equipeExterieur: 'AS.SP. V.B MAUGUIO 2', statut: 'a_venir' },
];

async function getEquipesMap(): Promise<Map<string, string>> {
  console.log('📥 Récupération des équipes R2F depuis Firebase...');
  const equipesQuery = query(
    collection(db, 'equipes'),
    where('championnatId', '==', 'regionale-2-f')
  );
  const equipesSnapshot = await getDocs(equipesQuery);

  const map = new Map<string, string>();
  equipesSnapshot.forEach((doc) => {
    const data = doc.data();
    map.set(data.nom, doc.id);
  });

  console.log(`✅ ${map.size} équipes trouvées\n`);
  return map;
}

async function deleteExistingMatchs() {
  console.log('🗑️  Suppression des matchs R2F existants...');
  const matchsQuery = query(
    collection(db, 'matchs'),
    where('championnatId', '==', 'regionale-2-f')
  );
  const matchsSnapshot = await getDocs(matchsQuery);

  let count = 0;
  for (const docSnapshot of matchsSnapshot.docs) {
    await deleteDoc(doc(db, 'matchs', docSnapshot.id));
    count++;
  }

  console.log(`✅ ${count} matchs supprimés\n`);
}

async function addMatchsWithIds(matchs: Match[], equipesMap: Map<string, string>) {
  console.log('💾 Ajout de tous les matchs...\n');
  let count = 0;
  let journeeActuelle = 0;

  for (const match of matchs) {
    if (match.journee !== journeeActuelle) {
      journeeActuelle = match.journee;
      console.log(`\n📅 Journée ${journeeActuelle}`);
    }

    const matchWithIds = {
      ...match,
      equipeDomicileId: equipesMap.get(match.equipeDomicile),
      equipeExterieurId: equipesMap.get(match.equipeExterieur),
    };

    await addDoc(collection(db, 'matchs'), matchWithIds);
    count++;
    console.log(`  ✅ ${match.equipeDomicile} vs ${match.equipeExterieur}`);
  }

  console.log(`\n✅ ${count} matchs ajoutés`);
}

async function main() {
  try {
    console.log('🏐 Ajout de tous les matchs Régionale 2 F\n');

    // 1. Récupérer les IDs des équipes
    const equipesMap = await getEquipesMap();

    // 2. Supprimer les matchs existants
    await deleteExistingMatchs();

    // 3. Ajouter tous les matchs
    await addMatchsWithIds(allMatchs, equipesMap);

    console.log('\n🎉 Import terminé avec succès !');
    console.log(`📊 ${allMatchs.length} matchs sur 15 journées`);
  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  }
}

main()
  .then(() => {
    console.log('\n✅ Script terminé');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale:', error);
    process.exit(1);
  });
