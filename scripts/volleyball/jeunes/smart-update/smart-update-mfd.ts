import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
import * as cheerio from 'cheerio';
import { firebaseConfig } from '../../../config/firebase-config';
import { initLogger } from '../../../utils/logger';
import { toTitleCase, normalizeTeamName } from '../../../utils/text-utils';
import {
  calculateHash,
  getScrapingState,
  updateScrapingState,
  logHashCheckResult,
  logNoChangeDetected,
  logChangeDetected,
  logStatistics,
  ScrapingState
} from '../../../utils/hash-detection';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const CLASSEMENT_STATE_KEY = 'mfd-classement';
const MATCHS_STATE_KEY = 'mfd-matchs';

interface EquipeData {
  nom: string;
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
  console.log('📥 Récupération de la page...');
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const buffer = await response.arrayBuffer();
  const decoder = new TextDecoder('iso-8859-1');
  return decoder.decode(buffer);
}


async function getEquipesMap(): Promise<Map<string, string>> {
  console.log('📥 Récupération des équipes Minimes Féminin depuis Firebase...');
  const equipesQuery = query(
    collection(db, 'equipes'),
    where('championnatId', '==', 'minimes-f')
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

function extractClassementSection(html: string): string {
  const $ = cheerio.load(html);
  let classementHtml = '';

  $('table').each((_, table) => {
    const headers = $(table).find('tr').first().find('th, td');
    const hasClassementStructure =
      $(headers).text().includes('Pts') &&
      $(headers).text().includes('Jou') &&
      $(headers).text().includes('Gag');

    if (hasClassementStructure) {
      classementHtml = $.html(table);
      return false; // break
    }
  });

  return classementHtml;
}

function extractMatchsSection(html: string): string {
  const $ = cheerio.load(html);
  let matchsHtml = '';

  $('tr').each((_, element) => {
    const rowText = $(element).text();
    if (rowText.match(/Journ[ée]+\s+\d+/i)) {
      matchsHtml += $.html(element);
    }
  });

  return matchsHtml;
}

async function scrapeClassement(html: string): Promise<EquipeData[]> {
  console.log('\n🔍 Scraping du classement...');
  const $ = cheerio.load(html);

  const equipes: EquipeData[] = [];

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
            const nom = toTitleCase(nomBrut);
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
              });
              console.log(`  ${rang}. ${nom} - ${points} pts`);
            }
          }
        });
    }
  });

  return equipes;
}

async function scrapeMatchs(html: string, equipesMap: Map<string, string>): Promise<Match[]> {
  console.log('\n🔍 Scraping des matchs...');
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
      championnatId: 'minimes-f',
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

async function updateEquipesInFirebase(equipes: EquipeData[]): Promise<void> {
  console.log('\n💾 Mise à jour des équipes dans Firebase...');

  let updated = 0;
  let notFound = 0;
  let unchanged = 0;

  for (const equipe of equipes) {
    const q = query(
      collection(db, 'equipes'),
      where('nom', '==', equipe.nom),
      where('championnatId', '==', 'minimes-f')
    );
    const existingEquipes = await getDocs(q);

    if (!existingEquipes.empty) {
      const existingDoc = existingEquipes.docs[0];
      const existingData = existingDoc.data();

      const hasChanged =
        existingData.rang !== equipe.rang ||
        existingData.points !== equipe.points ||
        existingData.joues !== equipe.joues ||
        existingData.gagnes !== equipe.gagnes ||
        existingData.perdus !== equipe.perdus ||
        existingData.setsPour !== equipe.setsPour ||
        existingData.setsContre !== equipe.setsContre;

      if (hasChanged) {
        await updateDoc(doc(db, 'equipes', existingDoc.id), {
          rang: equipe.rang,
          points: equipe.points,
          joues: equipe.joues,
          gagnes: equipe.gagnes,
          perdus: equipe.perdus,
          setsPour: equipe.setsPour,
          setsContre: equipe.setsContre,
        });

        console.log(`✅ ${equipe.nom} - Mise à jour : Rang ${existingData.rang} → ${equipe.rang}, Points ${existingData.points} → ${equipe.points}`);
        updated++;
      } else {
        unchanged++;
      }
    } else {
      console.log(`⚠️  ${equipe.nom} - Équipe non trouvée dans la base de données`);
      notFound++;
    }
  }

  console.log('\n📊 Résumé de la mise à jour du classement :');
  console.log(`   ✅ ${updated} équipe(s) mise(s) à jour`);
  console.log(`   ⏭️  ${unchanged} équipe(s) inchangée(s)`);
  if (notFound > 0) {
    console.log(`   ⚠️  ${notFound} équipe(s) non trouvée(s)`);
  }
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

  console.log('\n📊 Résumé de la mise à jour des matchs :');
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
  const startTime = Date.now();
  const logger = initLogger('smart-update-mfd');
  console.log(`📝 Logs enregistrés dans: ${logger.getLogFilePath()}\n`);

  try {
    console.log('🏐 Mise à jour SMART Minimes Féminin (Classement + Matchs fusionnés)\n');
    console.log('════════════════════════════════════════════════\n');

    await verifyEnvironment();

    // Récupérer l'URL depuis Firebase (1 seule fois)
    const url = await getChampionnatUrl('mfd');

    console.log('🔍 Vérification des changements...\n');
    const html = await fetchPage(url);

    // Calculer les hash séparés pour classement et matchs
    const classementSection = extractClassementSection(html);
    const matchsSection = extractMatchsSection(html);

    const classementHash = calculateHash(classementSection);
    const matchsHash = calculateHash(matchsSection);

    console.log(`   Hash classement: ${classementHash.substring(0, 16)}...`);
    console.log(`   Hash matchs: ${matchsHash.substring(0, 16)}...`);

    // Récupérer les états séparés
    let classementState = await getScrapingState(db, CLASSEMENT_STATE_KEY);
    let matchsState = await getScrapingState(db, MATCHS_STATE_KEY);

    if (!classementState) {
      console.log('   Aucun state classement précédent trouvé, initialisation...');
      classementState = {
        lastHash: '',
        lastUpdate: 0,
        lastChangeDetected: 0,
        consecutiveNoChange: 0,
        totalChecks: 0,
        totalUpdates: 0
      };
    }

    if (!matchsState) {
      console.log('   Aucun state matchs précédent trouvé, initialisation...');
      matchsState = {
        lastHash: '',
        lastUpdate: 0,
        lastChangeDetected: 0,
        consecutiveNoChange: 0,
        totalChecks: 0,
        totalUpdates: 0
      };
    }

    const classementChanged = classementHash !== classementState.lastHash;
    const matchsChanged = matchsHash !== matchsState.lastHash;

    console.log(`\n📊 Changements détectés :`);
    console.log(`   Classement: ${classementChanged ? '✅ OUI' : '❌ NON'}`);
    console.log(`   Matchs: ${matchsChanged ? '✅ OUI' : '❌ NON'}`);

    classementState.totalChecks++;
    matchsState.totalChecks++;

    if (!classementChanged && !matchsChanged) {
      classementState.consecutiveNoChange++;
      matchsState.consecutiveNoChange++;
      console.log('\n⏭️  Aucun changement détecté, pas de mise à jour nécessaire');
      await updateScrapingState(db, CLASSEMENT_STATE_KEY, classementState);
      await updateScrapingState(db, MATCHS_STATE_KEY, matchsState);

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`\n⏱️  Temps d'exécution: ${duration}s`);
      return;
    }

    const now = Date.now();

    // Récupérer la map des équipes (1 seule fois)
    const equipesMap = await getEquipesMap();

    // Mettre à jour le classement si changé
    if (classementChanged) {
      console.log('\n🔄 Mise à jour du classement...');
      classementState.lastHash = classementHash;
      classementState.lastChangeDetected = now;
      classementState.consecutiveNoChange = 0;
      classementState.totalUpdates++;

      const equipes = await scrapeClassement(html);
      console.log(`✅ ${equipes.length} équipes trouvées dans le classement`);

      if (equipes.length > 0) {
        await updateEquipesInFirebase(equipes);
        classementState.lastUpdate = now;
      }

      await updateScrapingState(db, CLASSEMENT_STATE_KEY, classementState);
    }

    // Mettre à jour les matchs si changé
    if (matchsChanged) {
      console.log('\n🔄 Mise à jour des matchs...');
      matchsState.lastHash = matchsHash;
      matchsState.lastChangeDetected = now;
      matchsState.consecutiveNoChange = 0;
      matchsState.totalUpdates++;

      const matchs = await scrapeMatchs(html, equipesMap);
      console.log(`✅ ${matchs.length} matchs trouvés`);

      if (matchs.length > 0) {
        await updateMatchsInFirebase(matchs);
        matchsState.lastUpdate = now;
      }

      await updateScrapingState(db, MATCHS_STATE_KEY, matchsState);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n📊 Statistiques finales :');
    if (classementChanged) {
      console.log('\n  Classement:');
      logStatistics(classementState);
    }
    if (matchsChanged) {
      console.log('\n  Matchs:');
      logStatistics(matchsState);
    }

    console.log(`\n⏱️  Temps d'exécution total: ${duration}s`);
    console.log('\n🎉 Mise à jour terminée avec succès !');
    console.log('════════════════════════════════════════════════');
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error('\n❌ Erreur:', error);
    console.log(`\n⏱️  Temps avant erreur: ${duration}s`);
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
