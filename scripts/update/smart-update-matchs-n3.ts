import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where, updateDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import * as cheerio from 'cheerio';
import { createHash } from 'crypto';
import { firebaseConfig } from '../config/firebase-config';
import { initLogger } from '../utils/logger';

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

interface ScrapingState {
  lastHash: string;
  lastUpdate: number;
  lastChangeDetected: number;
  consecutiveNoChange: number;
  totalChecks: number;
  totalUpdates: number;
}

const SCRAPING_STATE_COLLECTION = '_system';
const SCRAPING_STATE_DOC = 'scraping-state';
const STATE_KEY = 'n3-matchs';

async function fetchPage(url: string): Promise<string> {
  console.log('📥 Récupération de la page des matchs...');
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  // Convertir en latin1 puis en utf8 pour gérer l'encodage
  const buffer = await response.arrayBuffer();
  const decoder = new TextDecoder('iso-8859-1');
  return decoder.decode(buffer);
}

function calculateHash(content: string): string {
  return createHash('md5').update(content).digest('hex');
}

async function getScrapingState(): Promise<ScrapingState | null> {
  try {
    const stateDocRef = doc(db, SCRAPING_STATE_COLLECTION, SCRAPING_STATE_DOC);
    const stateDoc = await getDoc(stateDocRef);

    if (!stateDoc.exists()) {
      return null;
    }

    const data = stateDoc.data();
    return data[STATE_KEY] || null;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération du state:', error);
    return null;
  }
}

async function updateScrapingState(state: ScrapingState): Promise<void> {
  try {
    const stateDocRef = doc(db, SCRAPING_STATE_COLLECTION, SCRAPING_STATE_DOC);
    await setDoc(stateDocRef, {
      [STATE_KEY]: state
    }, { merge: true });
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour du state:', error);
  }
}

async function getEquipesMap(): Promise<Map<string, string>> {
  console.log('📥 Récupération des équipes N3F depuis Firebase...');
  const equipesQuery = query(
    collection(db, 'equipes'),
    where('championnatId', '==', 'nationale-3-f')
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
    const equipeDomicile = $(cells[3]).text().trim();
    const equipeExterieur = $(cells[5]).text().trim();
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
      !equipeDomicile ||
      !equipeExterieur ||
      equipeDomicile.length < 3 ||
      equipeExterieur.length < 3
    ) {
      return;
    }

    if (equipeDomicile.includes('Recevoir') || equipeDomicile.includes('Recevant')) {
      return;
    }

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
      championnatId: 'nationale-3-f',
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
  const logger = initLogger('smart-update-matchs-n3');
  console.log(`📝 Logs enregistrés dans: ${logger.getLogFilePath()}\n`);

  try {
    console.log('🏐 Mise à jour SMART des Matchs Nationale 3 Féminine\n');
    console.log('════════════════════════════════════════════════\n');

    await verifyEnvironment();

    const url = 'https://www.ffvbbeach.org/ffvbapp/resu/vbspo_calendrier.php?saison=2025%2F2026&codent=ABCCS&poule=3FB&division=&tour=&calend=COMPLET&x=20&y=18';

    // ÉTAPE 1: Récupérer le HTML de la page
    console.log('🔍 Vérification des changements...\n');
    const html = await fetchPage(url);

    // ÉTAPE 2: Calculer le hash du contenu
    const currentHash = calculateHash(html);
    console.log(`   Hash actuel: ${currentHash.substring(0, 16)}...`);

    // ÉTAPE 3: Récupérer le state précédent
    let state = await getScrapingState();

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
    console.log(`   Dernière mise à jour: ${state.lastUpdate ? new Date(state.lastUpdate).toLocaleString('fr-FR') : 'Jamais'}`);
    console.log(`   Checks sans changement: ${state.consecutiveNoChange}`);
    console.log(`   Total checks: ${state.totalChecks}`);
    console.log(`   Total updates: ${state.totalUpdates}`);

    // ÉTAPE 4: Comparer les hash
    state.totalChecks++;

    if (currentHash === state.lastHash) {
      // Aucun changement détecté
      state.consecutiveNoChange++;

      console.log('\n✅ Aucun changement détecté sur la page');
      console.log(`   La page n'a pas été modifiée depuis ${new Date(state.lastUpdate).toLocaleString('fr-FR')}`);
      console.log(`   Économie: Scraping complet évité ! 🎉`);

      // Mettre à jour le state avec le nouveau compteur
      await updateScrapingState(state);

      // Suggérer le prochain intervalle
      const nextCheckDelay = getNextCheckDelay(state.consecutiveNoChange);
      console.log(`\n💡 Suggestion: Prochain check dans ${Math.round(nextCheckDelay / 60000)} minutes`);

      return;
    }

    // ÉTAPE 5: Changement détecté, faire le scraping complet
    console.log('\n🔄 CHANGEMENT DÉTECTÉ ! Mise à jour complète en cours...\n');

    const now = Date.now();
    state.lastHash = currentHash;
    state.lastChangeDetected = now;
    state.consecutiveNoChange = 0;
    state.totalUpdates++;

    // Récupérer les équipes et scraper les matchs
    const equipesMap = await getEquipesMap();
    const matchs = await scrapeMatchs(url, equipesMap);
    console.log(`\n✅ ${matchs.length} matchs trouvés\n`);

    if (matchs.length === 0) {
      console.log('⚠️  Aucun match trouvé, vérifiez la structure de la page');
      return;
    }

    // Mettre à jour les matchs dans Firebase
    await updateMatchsInFirebase(matchs);

    // Mettre à jour le state avec la nouvelle date
    state.lastUpdate = now;
    await updateScrapingState(state);

    // Statistiques finales
    console.log('\n📈 Statistiques globales :');
    console.log(`   Total de checks effectués: ${state.totalChecks}`);
    console.log(`   Total de mises à jour: ${state.totalUpdates}`);
    const efficiency = ((state.totalChecks - state.totalUpdates) / state.totalChecks * 100).toFixed(1);
    console.log(`   Économie réalisée: ${efficiency}% des runs évités`);

    console.log('\n🎉 Mise à jour terminée avec succès !');
    console.log('════════════════════════════════════════════════');
  } catch (error) {
    console.error('\n❌ Erreur:', error);
    throw error;
  }
}

function getNextCheckDelay(consecutiveNoChange: number): number {
  if (consecutiveNoChange === 0) return 5 * 60 * 1000;   // 5 min
  if (consecutiveNoChange < 3) return 10 * 60 * 1000;    // 10 min
  if (consecutiveNoChange < 6) return 20 * 60 * 1000;    // 20 min
  if (consecutiveNoChange < 12) return 30 * 60 * 1000;   // 30 min
  return 60 * 60 * 1000;                                  // 1 heure
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
