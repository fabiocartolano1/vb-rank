import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  setDoc,
  writeBatch,
  deleteDoc,
} from 'firebase/firestore';
import * as cheerio from 'cheerio';

// Import environnement DEV
const devEnv = require('../src/environments/environment.development');

// Initialiser Firebase
const app = initializeApp(devEnv.environment.firebase);
const db = getFirestore(app);

// IDs des championnats jeunes
const JEUNES_IDS = ['m18m', 'bfc', 'bmb', 'mfd', 'mmb', 'cfd'];

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

async function fetchPage(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  // Gérer l'encodage iso-8859-1
  const buffer = await response.arrayBuffer();
  const decoder = new TextDecoder('iso-8859-1');
  return decoder.decode(buffer);
}

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

const toTitleCase = (str: string): string => {
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

async function scrapeClassement(url: string, championnatId: string): Promise<EquipeData[]> {
  console.log(`  📥 Récupération du classement...`);
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
      console.log(`  ✅ Tableau de classement trouvé`);

      $(table)
        .find('tr')
        .slice(1)
        .each((i, row) => {
          const cells = $(row).find('td');
          if (cells.length >= 8) {
            const nomRaw = $(cells[1]).text().trim();
            const nom = toTitleCase(nomRaw);
            const rang = parseInt($(cells[0]).text().trim()) || i + 1;
            const points = parseInt($(cells[2]).text().trim()) || 0;
            const joues = parseInt($(cells[3]).text().trim()) || 0;
            const gagnes = parseInt($(cells[4]).text().trim()) || 0;
            const perdus = parseInt($(cells[5]).text().trim()) || 0;
            const setsPour = parseInt($(cells[6]).text().trim()) || 0;
            const setsContre = parseInt($(cells[7]).text().trim()) || 0;

            if (nom) {
              equipes.push({
                nom,
                rang,
                points,
                joues,
                gagnes,
                perdus,
                setsPour,
                setsContre,
                championnatId,
                logoUrl: generateLogoUrl(nom, colorIndex++),
              });
            }
          }
        });
    }
  });

  console.log(`  ✅ ${equipes.length} équipes trouvées`);
  return equipes;
}

function normalizeTeamName(name: string): string {
  return name.trim().toUpperCase();
}

function parseScore(
  scoreText: string
): { domicile?: number; exterieur?: number; sets?: string[] } | null {
  const scoreMatch = scoreText.match(/(\d+)\s*-\s*(\d+)/);
  if (!scoreMatch) return null;

  const result: any = {
    domicile: parseInt(scoreMatch[1]),
    exterieur: parseInt(scoreMatch[2]),
  };

  const setsMatch = scoreText.match(/\(([^)]+)\)/);
  if (setsMatch) {
    const setsText = setsMatch[1];
    result.sets = setsText.split(/[,;]/).map((s) => s.trim().replace(/\s+/g, ':'));
  }

  return result;
}

async function scrapeMatchs(
  url: string,
  championnatId: string,
  equipesMap: Map<string, string>
): Promise<Match[]> {
  console.log(`  📥 Récupération des matchs...`);
  const html = await fetchPage(url);
  const $ = cheerio.load(html);

  const matchs: Match[] = [];
  let currentJournee = 0;

  $('table').each((_, table) => {
    $(table)
      .find('tr')
      .each((_, row) => {
        const cells = $(row).find('td');
        const text = $(row).text();

        // Détecter la journée
        if (text.includes('Journée') || text.includes('journée') || text.includes('JOURNEE')) {
          const journeeMatch = text.match(/\d+/);
          if (journeeMatch) {
            currentJournee = parseInt(journeeMatch[0]);
          }
        }

        // Parser les matchs
        if (cells.length >= 4 && currentJournee > 0) {
          const dateText = $(cells[0]).text().trim();
          const heureText = $(cells[1]).text().trim();
          const equipeDomicileRaw = $(cells[2]).text().trim();
          const equipeExterieurRaw = $(cells[3]).text().trim();
          const scoreText = $(cells[4]).text().trim();

          if (equipeDomicileRaw && equipeExterieurRaw) {
            const equipeDomicile = toTitleCase(equipeDomicileRaw);
            const equipeExterieur = toTitleCase(equipeExterieurRaw);

            const equipeDomicileNorm = normalizeTeamName(equipeDomicile);
            const equipeExterieurNorm = normalizeTeamName(equipeExterieur);

            let equipeDomicileId: string | undefined;
            let equipeExterieurId: string | undefined;

            for (const [nom, id] of equipesMap) {
              if (normalizeTeamName(nom) === equipeDomicileNorm) {
                equipeDomicileId = id;
              }
              if (normalizeTeamName(nom) === equipeExterieurNorm) {
                equipeExterieurId = id;
              }
            }

            const match: Match = {
              championnatId,
              journee: currentJournee,
              date: dateText,
              heure: heureText || undefined,
              equipeDomicile,
              equipeDomicileId,
              equipeExterieur,
              equipeExterieurId,
              statut: scoreText ? 'termine' : 'a_venir',
            };

            if (scoreText) {
              const score = parseScore(scoreText);
              if (score) {
                match.scoreDomicile = score.domicile;
                match.scoreExterieur = score.exterieur;
                match.detailSets = score.sets;
              }
            }

            matchs.push(match);
          }
        }
      });
  });

  console.log(`  ✅ ${matchs.length} matchs trouvés`);
  return matchs;
}

async function saveEquipes(equipes: EquipeData[]): Promise<Map<string, string>> {
  console.log(`  💾 Sauvegarde des équipes...`);
  const equipesMap = new Map<string, string>();

  for (const equipe of equipes) {
    const equipeId = `${equipe.championnatId}-${equipe.nom
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')}`;

    const docRef = doc(db, 'equipes', equipeId);
    await setDoc(docRef, equipe);
    equipesMap.set(equipe.nom, equipeId);
  }

  console.log(`  ✅ ${equipes.length} équipes sauvegardées`);
  return equipesMap;
}

async function deleteExistingMatchs(championnatId: string): Promise<void> {
  console.log(`  🗑️  Suppression des matchs existants...`);
  const matchsQuery = query(collection(db, 'matchs'), where('championnatId', '==', championnatId));
  const matchsSnapshot = await getDocs(matchsQuery);

  const deletePromises = matchsSnapshot.docs.map((doc) => deleteDoc(doc.ref));
  await Promise.all(deletePromises);

  console.log(`  ✅ ${matchsSnapshot.size} matchs supprimés`);
}

async function saveMatchs(matchs: Match[]): Promise<void> {
  console.log(`  💾 Sauvegarde des matchs...`);
  let saved = 0;

  for (const match of matchs) {
    await addDoc(collection(db, 'matchs'), match);
    saved++;
  }

  console.log(`  ✅ ${saved} matchs sauvegardés`);
}

async function processChampionnat(championnatId: string, url: string): Promise<boolean> {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🏐 Traitement du championnat: ${championnatId.toUpperCase()}`);
  console.log(`   URL: ${url}`);
  console.log(`${'='.repeat(60)}`);

  try {
    // Scraper le classement
    const equipes = await scrapeClassement(url, championnatId);

    if (equipes.length === 0) {
      console.log(`  ⚠️  Aucune équipe trouvée, passage au suivant`);
      return false;
    }

    // Sauvegarder les équipes
    const equipesMap = await saveEquipes(equipes);

    // Supprimer les matchs existants
    await deleteExistingMatchs(championnatId);

    // Scraper les matchs
    const matchs = await scrapeMatchs(url, championnatId, equipesMap);

    // Sauvegarder les matchs
    if (matchs.length > 0) {
      await saveMatchs(matchs);
    }

    console.log(`\n  ✅ Championnat ${championnatId.toUpperCase()} traité avec succès!`);
    return true;
  } catch (error) {
    console.error(`  ❌ Erreur pour ${championnatId}:`, error);
    return false;
  }
}

async function main() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  🏐 Scraping des championnats jeunes                      ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  console.log('📡 Connexion à Firebase...\n');

  // Récupérer tous les championnats jeunes depuis Firebase
  const championnatsSnapshot = await getDocs(collection(db, 'championnats'));

  const championnatsToProcess: { id: string; url: string }[] = [];

  championnatsSnapshot.forEach((doc) => {
    const id = doc.id;
    const data = doc.data();

    if (JEUNES_IDS.includes(id) && data.url) {
      championnatsToProcess.push({ id, url: data.url });
    }
  });

  console.log(`📋 ${championnatsToProcess.length} championnats jeunes trouvés avec URL:\n`);
  championnatsToProcess.forEach((c) => {
    console.log(`   - ${c.id.toUpperCase()}`);
  });

  if (championnatsToProcess.length === 0) {
    console.log('\n⚠️  Aucun championnat jeune avec URL trouvé!');
    console.log('   Assurez-vous d\'avoir ajouté les URLs dans Firebase Console.');
    process.exit(1);
  }

  // Traiter chaque championnat
  let successCount = 0;
  let errorCount = 0;

  for (const championnat of championnatsToProcess) {
    const success = await processChampionnat(championnat.id, championnat.url);
    if (success) {
      successCount++;
    } else {
      errorCount++;
    }
  }

  // Résumé
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  📊 Résumé du scraping                                     ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  console.log(`✅ Championnats traités avec succès: ${successCount}`);
  console.log(`❌ Championnats en erreur: ${errorCount}`);
  console.log(`📦 Total: ${championnatsToProcess.length}`);

  console.log('\n✨ Terminé!\n');
  process.exit(0);
}

main().catch((error) => {
  console.error('\n❌ Erreur fatale:', error);
  process.exit(1);
});
