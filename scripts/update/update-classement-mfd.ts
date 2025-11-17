import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
import * as cheerio from 'cheerio';
import { firebaseConfig } from '../config/firebase-config';
import { initLogger } from '../utils/logger';
import { validateClassementData } from '../utils/validation';

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
  console.log('📥 Récupération de la page de classement...');
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  // Convertir en latin1 puis en utf8 pour gérer l'encodage
  const buffer = await response.arrayBuffer();
  const decoder = new TextDecoder('iso-8859-1');
  return decoder.decode(buffer);
}

// Fonction helper pour convertir en title case
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

async function updateEquipesInFirebase(equipes: EquipeData[]): Promise<void> {
  console.log('\n💾 Mise à jour des équipes dans Firebase...');

  let updated = 0;
  let notFound = 0;
  let unchanged = 0;
  let failed = 0;
  const errors: Array<{ equipe: string; error: string }> = [];

  // Optimisation : vérification rapide sur les 3 premières équipes
  console.log('⚡ Vérification rapide des changements...');
  let hasAnyChange = false;
  const samplesToCheck = Math.min(3, equipes.length);

  for (let i = 0; i < samplesToCheck; i++) {
    const equipe = equipes[i];
    const nomNormalized = normalizeTeamName(equipe.nom);

    for (const [nom, id] of equipesMap.entries()) {
      if (normalizeTeamName(nom) === nomNormalized) {
        const existingDoc = await getDocs(query(
          collection(db, 'equipes'),
          where('championnatId', '==', 'mfd'),
          where('nom', '==', nom)
        ));

        if (!existingDoc.empty) {
          const existingData = existingDoc.docs[0].data();
          const hasChanged =
            existingData.rang !== equipe.rang ||
            existingData.points !== equipe.points ||
            existingData.joues !== equipe.joues ||
            existingData.gagnes !== equipe.gagnes ||
            existingData.perdus !== equipe.perdus ||
            existingData.setsPour !== equipe.setsPour ||
            existingData.setsContre !== equipe.setsContre;

          if (hasChanged) {
            hasAnyChange = true;
            break;
          }
        }
        break;
      }
    }

    if (hasAnyChange) break;
  }

  if (!hasAnyChange) {
    console.log('✅ Aucun changement détecté sur l\'échantillon - arrêt anticipé');
    console.log('\n📊 Résumé de la mise à jour :');
    console.log(`   ✅ 0 équipe(s) mise(s) à jour`);
    console.log(`   ⏭️  ${equipes.length} équipe(s) probablement inchangée(s)`);
    console.log('   ⚡ Optimisation : script terminé rapidement sans parcourir toutes les équipes');
    return;
  }

  console.log('🔄 Changements détectés - traitement de toutes les équipes...\n');

  for (const equipe of equipes) {
    try {
    // Rechercher l'équipe existante
    const q = query(
      collection(db, 'equipes'),
      where('nom', '==', equipe.nom),
      where('championnatId', '==', 'mfd')
    );
    const existingEquipes = await getDocs(q);

    if (!existingEquipes.empty) {
      const existingDoc = existingEquipes.docs[0];
      const existingData = existingDoc.data();

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
    console.log(`   ⚠️  ${notFound}   if (failed > 0) {
    console.log(`   ❌ ${failed} équipe(s) en erreur`);
  }

  // Si des erreurs se sont produites, lever une exception
  if (errors.length > 0) {
    throw new Error(
      `${errors.length} erreur(s) lors de la mise à jour:\n${errors.map(e => `  - ${e.equipe}: ${e.error}`).join('\n')}`
    );
  }
équipe(s) non trouvée(s)`);
  }
    } catch (error) {
      failed++;
      const errorMsg = error instanceof Error ? error.message : String(error);
      const equipeDesc = `${equipe.nom} (Rang ${equipe.rang})`;
      errors.push({ equipe: equipeDesc, error: errorMsg });
      console.error(`❌ Erreur lors de la mise à jour de ${equipeDesc}: ${errorMsg}`);
    }
}

async function verifyEnvironment(): Promise<void> {
  console.log('🔍 Vérification de l\'environnement...');

  const projectId = firebaseConfig.projectId;
  console.log(`   Projet Firebase: ${projectId}`);

  if (!projectId.includes('vb-rank')) {
    throw new Error('⚠️  ATTENTION: Le projet Firebase ne semble pas être le bon !');
  }

  // Vérifier que nous sommes en développement
  const isDev = process.env.NODE_ENV !== 'production';
  console.log(`   Environnement: ${isDev ? 'développement' : 'production'}`);

  console.log('✅ Environnement vérifié\n');
}

async function main() {
  // Initialiser le logger
  const logger = initLogger('update-classement-mfd');
  console.log(`📝 Logs enregistrés dans: ${logger.getLogFilePath()}\n`);

  try {
    console.log('🏐 Mise à jour du Classement MFD\n');
    console.log('════════════════════════════════════════════════\n');

    // Vérifier l'environnement avant de continuer
    await verifyEnvironment();

    // Récupérer l'URL depuis Firebase
    const url = await getChampionnatUrl('mfd');

    // 1. Scraper le classement
    const equipes = await scrapeClassement(url);
    console.log(`\n✅ ${equipes.length} équipes trouvées dans le classement\n`);

    // 3. Valider les données scrapées
    console.log('🔍 Validation des données scrapées...');
    const validation = validateClassementData(equipes, 8);

    if (validation.warnings.length > 0) {
      console.log('\n⚠️  Avertissements :');
      validation.warnings.forEach(warning => console.log(`   ${warning}`));
    }

    if (!validation.isValid) {
      console.log('\n❌ Erreurs de validation :');
      validation.errors.forEach(error => console.log(`   ${error}`));
      throw new Error('Validation des données échouée - données non fiables, mise à jour annulée');
    }

    console.log('✅ Validation réussie\n');

    // 2. Mettre à jour les équipes dans Firebase
    await updateEquipesInFirebase(equipes);

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
