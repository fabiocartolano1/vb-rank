import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
import * as cheerio from 'cheerio';
import { firebaseConfig } from '../config/firebase-config';
import { initLogger } from '../utils/logger';
import {
  calculateHash,
  getScrapingState,
  updateScrapingState,
  logHashCheckResult,
  logNoChangeDetected,
  logChangeDetected,
  logStatistics,
  ScrapingState
} from '../utils/hash-detection';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const STATE_KEY = 'mmb-matchs';

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

async function getChampionnatUrl(championnatId: string): Promise<string> {
  console.log(`📡 Récupération de l'URL du championnat ${championnatId}...`);
  const championnatDoc = await getDocs(
    query(collection(db, 'championnats'), where('__name__', '==', championnatId))
  );

  if (championnatDoc.empty) {
    throw new Error(`❌ Championnat ${championnatId} non trouvé dans Firebase`);
  }

  const url = championnatDoc.docs[0].data().url;
  if (!url) {
    throw new Error(`❌ URL non renseignée pour ${championnatId} dans Firebase`);
  }

  console.log(`   URL: ${url}\n`);
  return url;
}



async function fetchPage(url: string): Promise<string> {
  console.log('📥 Récupération de la page des matchs...');
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const buffer = await response.arrayBuffer();
  const decoder = new TextDecoder('iso-8859-1');
  return decoder.decode(buffer);
}

async function getEquipesMap(): Promise<Map<string, string>> {
  console.log('📥 Récupération des équipes MMB depuis Firebase...');
  const equipesQuery = query(
    collection(db, 'equipes'),
    where('championnatId', '==', 'minimes-m-bronze')
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

function normalizeTeamName(name: string): string {
  return name.trim().toUpperCase();
}

const toTitleCase = (str: string): string => {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

async function scrapeMatchs(url: string, equipesMap: Map<string, string>): Promise<Match[]> {
  const html = await fetchPage(url);
  const $ = cheerio.load(html);

  const matchs: Match[] = [];
  let currentJournee = 0;

  $('tr').each((_, element) => {
    const $row = $(element);
    const rowText = $row.text();

    const journeeMatch = rowText.match(/Journ[ée]+\s+(\d+)/i);
    if (journeeMatch) {
      currentJournee = parseInt(journeeMatch[1]);
      console.log(`  📅 Journée ${currentJournee}`);
    }

    if (currentJournee === 0) return;

    const cells = $row.find('td');
    if (cells.length < 4) return;

    let matchPlayed = false;

    cells.each(function () {
      if ($(this).is('.lienblanc_pt')) {
        matchPlayed = true;
        return false;
      }
    });

    const dateText = $(cells[1]).text().trim();
    const heureText = $(cells[2]).text().trim();
    const equipeDomicileRaw = $(cells[3]).text().trim();
    const equipeExterieurRaw = $(cells[5]).text().trim();
    let scoreDomicile = '';
    let scoreExterieur = '';
    let sets: string[] = [];
    let statut = 'a_venir';

    if (matchPlayed) {
      scoreDomicile = $(cells[6]).text().trim();
      scoreExterieur = $(cells[7]).text().trim();
      sets = $(cells[8])
        .text()
        .trim()
        .split(/[,;]/)
        .map((s) => s.trim().replace(/\s+/g, ':'));
      statut = 'termine';
    }

    if (
      !equipeDomicileRaw ||
      !equipeExterieurRaw ||
      equipeDomicileRaw.length < 3 ||
      equipeExterieurRaw.length < 3
    ) {
      return;
    }

    if (equipeDomicileRaw.includes('Recevoir') || equipeDomicileRaw.includes('Recevant')) {
      return;
    }

    const equipeDomicile = toTitleCase(equipeDomicileRaw);
    const equipeExterieur = toTitleCase(equipeExterieurRaw);

    const dateArray = dateText.split('/');
    const date = `20${dateArray[2]}-${dateArray[1]}-${dateArray[0]}`;

    const nomDomicileNorm = normalizeTeamName(equipeDomicile);
    const nomExterieurNorm = normalizeTeamName(equipeExterieur);

    let equipeDomicileId: string | undefined;
    let equipeExterieurId: string | undefined;
    let equipeDomicileNom: string = equipeDomicile;
    let equipeExterieurNom: string = equipeExterieur;

    for (const [nom, id] of equipesMap.entries()) {
      if (normalizeTeamName(nom) === nomDomicileNorm) {
        equipeDomicileId = id;
        equipeDomicileNom = nom;
      }
      if (normalizeTeamName(nom) === nomExterieurNorm) {
        equipeExterieurId = id;
        equipeExterieurNom = nom;
      }
    }

    const match: any = {
      championnatId: 'minimes-m-bronze',
      journee: currentJournee,
      date,
      heure: heureText,
      equipeDomicile: equipeDomicileNom,
      equipeExterieur: equipeExterieurNom,
      scoreDomicile: scoreDomicile != '' ? parseInt(scoreDomicile) : null,
      scoreExterieur: scoreExterieur != '' ? parseInt(scoreExterieur) : null,
      detailSets: sets.length > 0 ? sets : null,
      statut,
    };

    if (equipeDomicileId) {
      match.equipeDomicileId = equipeDomicileId;
    }
    if (equipeExterieurId) {
      match.equipeExterieurId = equipeExterieurId;
    }

    matchs.push(match);
  });

  return matchs;
}

async function updateMatchsInFirebase(matchs: Match[]): Promise<void> {
  console.log('\n💾 Mise à jour des matchs dans Firebase...');

  let updated = 0;
  let notFound = 0;
  let unchanged = 0;

  for (const match of matchs) {
    const q = query(
      collection(db, 'matchs'),
      where('championnatId', '==', match.championnatId),
      where('journee', '==', match.journee),
      where('equipeDomicile', '==', match.equipeDomicile),
      where('equipeExterieur', '==', match.equipeExterieur)
    );
    const existingMatchs = await getDocs(q);

    if (!existingMatchs.empty) {
      const existingDoc = existingMatchs.docs[0];
      const existingData = existingDoc.data();

      const hasChanged =
        existingData.date !== match.date ||
        existingData.heure !== match.heure ||
        existingData.scoreDomicile !== match.scoreDomicile ||
        existingData.scoreExterieur !== match.scoreExterieur ||
        existingData.statut !== match.statut ||
        JSON.stringify(existingData.detailSets) !== JSON.stringify(match.detailSets);

      if (hasChanged) {
        const updateData: any = {
          date: match.date,
          heure: match.heure,
          statut: match.statut,
        };

        if (match.scoreDomicile !== null) {
          updateData.scoreDomicile = match.scoreDomicile;
        }
        if (match.scoreExterieur !== null) {
          updateData.scoreExterieur = match.scoreExterieur;
        }
        if (match.detailSets !== null) {
          updateData.detailSets = match.detailSets;
        }

        if (match.equipeDomicileId) {
          updateData.equipeDomicileId = match.equipeDomicileId;
        }
        if (match.equipeExterieurId) {
          updateData.equipeExterieurId = match.equipeExterieurId;
        }

        await updateDoc(doc(db, 'matchs', existingDoc.id), updateData);

        const statusChange = existingData.statut !== match.statut ? ` (${existingData.statut} → ${match.statut})` : '';
        const scoreChange = match.scoreDomicile !== null && match.scoreExterieur !== null
          ? ` - Score: ${match.scoreDomicile}-${match.scoreExterieur}`
          : '';
        console.log(`✅ J${match.journee}: ${match.equipeDomicile} vs ${match.equipeExterieur}${statusChange}${scoreChange}`);
        updated++;
      } else {
        unchanged++;
      }
    } else {
      console.log(`⚠️  J${match.journee}: ${match.equipeDomicile} vs ${match.equipeExterieur} - Match non trouvé dans la base de données`);
      notFound++;
    }
  }

  console.log('\n📊 Résumé de la mise à jour :');
  console.log(`   ✅ ${updated} match(s) mis à jour`);
  console.log(`   ⏭️  ${unchanged} match(s) inchangé(s)`);
  if (notFound > 0) {
    console.log(`   ⚠️  ${notFound} match(s) non trouvé(s)`);
  }
}

async function verifyEnvironment(): Promise<void> {
  console.log('🔍 Vérification de l\'environnement...');

  const projectId = firebaseConfig.projectId;
  console.log(`   Projet Firebase: ${projectId}`);

  const validProjects = ['vb-rank', 'le-cres-vb'];
  if (!validProjects.some(p => projectId.includes(p))) {
    throw new Error('⚠️  ATTENTION: Le projet Firebase ne semble pas être valide !');
  }

  const isProd = projectId.includes('le-cres-vb');
  console.log(`   Environnement: ${isProd ? 'production' : 'développement'}`);

  console.log('✅ Environnement vérifié\n');
}

async function main() {
  const logger = initLogger('smart-update-matchs-mmb');
  console.log(`📝 Logs enregistrés dans: ${logger.getLogFilePath()}\n`);

  try {
    console.log('🏐 Mise à jour SMART des Matchs Minimes M Bronze\n');
    console.log('════════════════════════════════════════════════\n');

    await verifyEnvironment();

    // Récupérer l'URL depuis Firebase
    const url = await getChampionnatUrl('minimes-m-bronze');

    console.log('🔍 Vérification des changements...\n');
    const html = await fetchPage(url);

    const currentHash = calculateHash(html);
    console.log(`   Hash actuel: ${currentHash.substring(0, 16)}...`);

    let state = await getScrapingState(db, STATE_KEY);

    if (!state) {
      console.log('   Aucun state précédent trouvé, initialisation...');
      state = {
        lastHash: '',
        lastUpdate: 0,
        lastChangeDetected: 0,
        consecutiveNoChange: 0,
        totalChecks: 0,
        totalUpdates: 0
      };
    }

    console.log(`   Hash précédent: ${state.lastHash ? state.lastHash.substring(0, 16) + '...' : 'N/A'}`);
    logHashCheckResult(state, STATE_KEY);

    state.totalChecks++;

    if (currentHash === state.lastHash) {
      state.consecutiveNoChange++;
      logNoChangeDetected(state);
      await updateScrapingState(db, STATE_KEY, state);
      return;
    }

    logChangeDetected();

    const now = Date.now();
    state.lastHash = currentHash;
    state.lastChangeDetected = now;
    state.consecutiveNoChange = 0;
    state.totalUpdates++;

    const equipesMap = await getEquipesMap();
    const matchs = await scrapeMatchs(url, equipesMap);
    console.log(`\n✅ ${matchs.length} matchs trouvés\n`);

    if (matchs.length === 0) {
      console.log('⚠️  Aucun match trouvé, vérifiez la structure de la page');
      return;
    }

    await updateMatchsInFirebase(matchs);

    state.lastUpdate = now;
    await updateScrapingState(db, STATE_KEY, state);

    logStatistics(state);

    console.log('\n🎉 Mise à jour terminée avec succès !');
    console.log('════════════════════════════════════════════════');
  } catch (error) {
    console.error('\n❌ Erreur:', error);
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
