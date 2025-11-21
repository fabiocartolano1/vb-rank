import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
import * as cheerio from 'cheerio';
import { firebaseConfig } from '../../../config/firebase-config';
import { initLogger } from '../../../utils/logger';
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
const STATE_KEY = 'r2f-classement';

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

async function fetchPage(url: string): Promise<string> {
  console.log('📥 Récupération de la page de classement...');
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.text();
}

const toTitleCase = (str: string): string => {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

async function scrapeClassement(url: string): Promise<EquipeData[]> {
  const html = await fetchPage(url);
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

async function updateEquipesInFirebase(equipes: EquipeData[]): Promise<void> {
  console.log('\n💾 Mise à jour des équipes dans Firebase...');

  let updated = 0;
  let notFound = 0;
  let unchanged = 0;

  for (const equipe of equipes) {
    const q = query(
      collection(db, 'equipes'),
      where('nom', '==', equipe.nom),
      where('championnatId', '==', 'regionale-2-f')
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
        console.log(`⏭️  ${equipe.nom} - Aucun changement`);
        unchanged++;
      }
    } else {
      console.log(`⚠️  ${equipe.nom} - Équipe non trouvée dans la base de données`);
      notFound++;
    }
  }

  console.log('\n📊 Résumé de la mise à jour :');
  console.log(`   ✅ ${updated} équipe(s) mise(s) à jour`);
  console.log(`   ⏭️  ${unchanged} équipe(s) inchangée(s)`);
  if (notFound > 0) {
    console.log(`   ⚠️  ${notFound} équipe(s) non trouvée(s)`);
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
  const logger = initLogger('smart-update-classement-r2f');
  console.log(`📝 Logs enregistrés dans: ${logger.getLogFilePath()}\n`);

  try {
    console.log('🏐 Mise à jour SMART du Classement Régionale 2 Féminine\n');
    console.log('════════════════════════════════════════════════\n');

    await verifyEnvironment();

    const url = 'https://www.ffvbbeach.org/ffvbapp/resu/vbspo_calendrier.php?saison=2025%2F2026&codent=LILR&poule=RF2&division=&tour=&calend=COMPLET';

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

    const equipes = await scrapeClassement(url);
    console.log(`\n✅ ${equipes.length} équipes trouvées dans le classement\n`);

    if (equipes.length === 0) {
      console.log('⚠️  Aucune équipe trouvée, vérifiez la structure de la page');
      return;
    }

    await updateEquipesInFirebase(equipes);

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
