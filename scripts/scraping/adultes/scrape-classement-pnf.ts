import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import * as cheerio from 'cheerio';

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

interface EquipeData {
  nom: string;
  rang: number;
  points: number;
  joues: number;
  gagnes: number;
  perdus: number;
  setsPour: number;
  setsContre: number;
  championnatId: string;
  logoUrl: string;
}

// Couleurs pour les logos
const colors = [
  '1e40af',
  '16a34a',
  'dc2626',
  'ea580c',
  '7c3aed',
  '0891b2',
  'c026d3',
  'ca8a04',
  '059669',
  'be123c',
  '8b5cf6',
  '06b6d4',
  'f59e0b',
  'ec4899',
  '10b981',
];

async function fetchPage(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.text();
}
  // Fonction helper pour convertir en title case
  const toTitleCase = (str: string): string => {
    return str
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
function generateLogoUrl(nom: string, colorIndex: number): string {
  const initials = nom
    .split(' ')
    .map((word) => word[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
  return `https://ui-avatars.com/api/?name=${initials}&background=${
    colors[colorIndex % colors.length]
  }&color=fff&size=128&bold=true&font-size=0.5`;
}

async function scrapeClassement(url: string): Promise<EquipeData[]> {
  console.log('📥 Récupération de la page de classement...');
  const html = await fetchPage(url);
  const $ = cheerio.load(html);

  const equipes: EquipeData[] = [];
  let colorIndex = 0;

  // Trouver le tableau de classement
  $('table').each((_, table) => {
    const headers = $(table).find('tr').first().find('th, td');
    const hasClassementStructure =
      $(headers).text().includes('Pts') &&
      $(headers).text().includes('Jou') &&
      $(headers).text().includes('Gag');

    if (hasClassementStructure) {
      console.log('✅ Tableau de classement trouvé');

      $(table)
        .find('tr')
        .slice(1)
        .each((index, row) => {
          const cells = $(row).find('td');

          if (cells.length >= 8) {
            const rang = parseInt($(cells[0]).text().trim()) || index + 1;
            const nomBrut = $(cells[1]).text().trim();
            const nom = toTitleCase(nomBrut); // Conversion en title case
            const points = parseInt($(cells[2]).text().trim()) || 0;
            const joues = parseInt($(cells[3]).text().trim()) || 0;
            const gagnes = parseInt($(cells[4]).text().trim()) || 0;
            const perdus = parseInt($(cells[5]).text().trim()) || 0;
            const setsPour = parseInt($(cells[6]).text().trim()) || 0;
            const setsContre = parseInt($(cells[7]).text().trim()) || 0;

            if (nom && nom.length > 2) {
              equipes.push({
                nom,
                rang,
                points,
                joues,
                gagnes,
                perdus,
                setsPour,
                setsContre,
                championnatId: 'prenationale-f',
                logoUrl: generateLogoUrl(nom, colorIndex++),
              });
              console.log(`  ${rang}. ${nom} - ${points} pts`);
            }
          }
        });
    }
  });

  return equipes;
}

async function saveEquipesToFirebase(equipes: EquipeData[]): Promise<Map<string, string>> {
  console.log('\n💾 Sauvegarde des équipes dans Firebase...');
  const equipesMap = new Map<string, string>();

  for (const equipe of equipes) {
    // Vérifier si l'équipe existe déjà
    const q = query(
      collection(db, 'equipes'),
      where('nom', '==', equipe.nom),
      where('championnatId', '==', 'prenationale-f')
    );
    const existingEquipes = await getDocs(q);

    if (existingEquipes.empty) {
      const docRef = await addDoc(collection(db, 'equipes'), equipe);
      equipesMap.set(equipe.nom, docRef.id);
      console.log(`✅ ${equipe.nom} créée (ID: ${docRef.id})`);
    } else {
      const existingId = existingEquipes.docs[0].id;
      equipesMap.set(equipe.nom, existingId);
      console.log(`⏭️  ${equipe.nom} existe déjà (ID: ${existingId})`);
    }
  }

  return equipesMap;
}

async function main() {
  try {
    console.log('🏐 Scraping Classement PNF\n');

    const url =
      'https://www.ffvbbeach.org/ffvbapp/resu/vbspo_calendrier.php?saison=2025/2026&codent=LILR&poule=PFA';

    // 1. Scraper le classement
    const equipes = await scrapeClassement(url);
    console.log(`\n✅ ${equipes.length} équipes trouvées`);

    if (equipes.length === 0) {
      console.log('⚠️  Aucune équipe trouvée, vérifiez la structure de la page');
      return;
    }

    // 2. Sauvegarder les équipes et récupérer leurs IDs
    const equipesMap = await saveEquipesToFirebase(equipes);

    console.log('\n🎉 Scraping terminé avec succès !');
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
