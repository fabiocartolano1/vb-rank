import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
import * as cheerio from 'cheerio';
import { firebaseConfig } from '../config/firebase-config';
import { initLogger } from '../utils/logger';

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
}

async function fetchPage(url: string): Promise<string> {
  console.log('📥 Récupération de la page de classement...');
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

// Fonction pour normaliser les noms d'équipes pour le matching
function normalizeTeamName(name: string): string {
  // Supprimer les accents et mettre en majuscules
  return name
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

async function scrapeClassement(url: string): Promise<EquipeData[]> {
  const html = await fetchPage(url);
  const $ = cheerio.load(html);

  const equipes: EquipeData[] = [];

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

async function getEquipesMap(): Promise<Map<string, string>> {
  console.log('📥 Récupération des équipes R2M depuis Firebase...');
  const equipesQuery = query(
    collection(db, 'equipes'),
    where('championnatId', '==', 'regionale-2-m')
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

async function updateEquipesInFirebase(equipes: EquipeData[], equipesMap: Map<string, string>): Promise<void> {
  console.log('\n💾 Mise à jour des équipes dans Firebase...');

  let updated = 0;
  let notFound = 0;
  let unchanged = 0;

  for (const equipe of equipes) {
    // Normaliser le nom de l'équipe scrapée
    const nomNormalized = normalizeTeamName(equipe.nom);

    // Trouver l'équipe dans la Map en comparant les noms normalisés
    let equipeId: string | undefined;
    let nomExact: string | undefined;

    for (const [nom, id] of equipesMap.entries()) {
      if (normalizeTeamName(nom) === nomNormalized) {
        equipeId = id;
        nomExact = nom;
        break;
      }
    }

    if (equipeId && nomExact) {
      // Récupérer les données existantes
      const existingDoc = await getDocs(query(
        collection(db, 'equipes'),
        where('championnatId', '==', 'regionale-2-m'),
        where('nom', '==', nomExact)
      ));

      if (!existingDoc.empty) {
        const existingData = existingDoc.docs[0].data();

        // Vérifier si les données ont changé
        const hasChanged =
          existingData.rang !== equipe.rang ||
          existingData.points !== equipe.points ||
          existingData.joues !== equipe.joues ||
          existingData.gagnes !== equipe.gagnes ||
          existingData.perdus !== equipe.perdus ||
          existingData.setsPour !== equipe.setsPour ||
          existingData.setsContre !== equipe.setsContre;

        if (hasChanged) {
          // Mettre à jour uniquement les données de classement
          await updateDoc(doc(db, 'equipes', equipeId), {
            rang: equipe.rang,
            points: equipe.points,
            joues: equipe.joues,
            gagnes: equipe.gagnes,
            perdus: equipe.perdus,
            setsPour: equipe.setsPour,
            setsContre: equipe.setsContre,
          });

          console.log(`✅ ${nomExact} - Mise à jour : Rang ${existingData.rang} → ${equipe.rang}, Points ${existingData.points} → ${equipe.points}`);
          updated++;
        } else {
          console.log(`⏭️  ${nomExact} - Aucun changement`);
          unchanged++;
        }
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

  // Vérifier que c'est un projet Firebase valide (dev ou prod)
  const validProjects = ['vb-rank', 'le-cres-vb'];
  if (!validProjects.some(p => projectId.includes(p))) {
    throw new Error('⚠️  ATTENTION: Le projet Firebase ne semble pas être valide !');
  }

  // Déterminer l'environnement
  const isProd = projectId.includes('le-cres-vb');
  console.log(`   Environnement: ${isProd ? 'production' : 'développement'}`);

  console.log('✅ Environnement vérifié\n');
}

async function main() {
  // Initialiser le logger
  const logger = initLogger('update-classement-r2m');
  console.log(`📝 Logs enregistrés dans: ${logger.getLogFilePath()}\n`);

  try {
    console.log('🏐 Mise à jour du Classement Régionale 2 Masculine\n');
    console.log('════════════════════════════════════════════════\n');

    // Vérifier l'environnement avant de continuer
    await verifyEnvironment();

    const url =
      'https://www.ffvbbeach.org/ffvbapp/resu/vbspo_calendrier.php?saison=2025%2F2026&codent=LILR&poule=RM2&division=&tour=&calend=COMPLET';

    // 1. Récupérer les équipes depuis Firebase
    const equipesMap = await getEquipesMap();

    // 2. Scraper le classement
    const equipes = await scrapeClassement(url);
    console.log(`\n✅ ${equipes.length} équipes trouvées dans le classement\n`);

    if (equipes.length === 0) {
      console.log('⚠️  Aucune équipe trouvée, vérifiez la structure de la page');
      return;
    }

    // 3. Mettre à jour les équipes dans Firebase
    await updateEquipesInFirebase(equipes, equipesMap);

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
