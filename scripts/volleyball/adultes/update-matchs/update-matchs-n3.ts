import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
import * as cheerio from 'cheerio';
import { firebaseConfig } from '../../../config/firebase-config';
import { initLogger } from '../../../utils/logger';

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
  // Normaliser les noms d'équipes pour matcher ceux en base
  return name.trim().toUpperCase();
}

async function scrapeMatchs(url: string, equipesMap: Map<string, string>): Promise<Match[]> {
  const html = await fetchPage(url);
  const $ = cheerio.load(html);

  const matchs: Match[] = [];
  let currentJournee = 0;

  // Trouver tous les éléments de journée
  $('tr').each((_, element) => {
    const $row = $(element);
    const rowText = $row.text();

    // Détecter une nouvelle journée
    const journeeMatch = rowText.match(/Journ[ée]+\s+(\d+)/i);
    if (journeeMatch) {
      currentJournee = parseInt(journeeMatch[1]);
      console.log(`  📅 Journée ${currentJournee}`);
    }
    // Si pas de journée en cours, continuer
    if (currentJournee === 0) return;

    // Chercher les cellules du match
    const cells = $row.find('td');
    if (cells.length < 4) return;

    //check si match joué
    let matchPlayed = false;

    cells.each(function () {
      if ($(this).is('.lienblanc_pt')) {
        matchPlayed = true;
        return false; // Arrête la boucle dès qu'on trouve
      }
    });

    // Extraire les données
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

    // Vérifier que nous avons des noms d'équipes valides
    if (
      !equipeDomicile ||
      !equipeExterieur ||
      equipeDomicile.length < 3 ||
      equipeExterieur.length < 3
    ) {
      return;
    }

    // Vérifier si c'est une ligne de match (pas un en-tête)
    if (equipeDomicile.includes('Recevoir') || equipeDomicile.includes('Recevant')) {
      return;
    }

    const dateArray = dateText.split('/');
    const date = `20${dateArray[2]}-${dateArray[1]}-${dateArray[0]}`;

    // Normaliser les noms pour matcher avec la base
    const nomDomicileNorm = normalizeTeamName(equipeDomicile);
    const nomExterieurNorm = normalizeTeamName(equipeExterieur);

    // Trouver les IDs des équipes et leurs noms exacts depuis la base
    let equipeDomicileId: string | undefined;
    let equipeExterieurId: string | undefined;
    let equipeDomicileNom: string = equipeDomicile;
    let equipeExterieurNom: string = equipeExterieur;

    for (const [nom, id] of equipesMap.entries()) {
      if (normalizeTeamName(nom) === nomDomicileNorm) {
        equipeDomicileId = id;
        equipeDomicileNom = nom; // Utiliser le nom depuis la base
      }
      if (normalizeTeamName(nom) === nomExterieurNorm) {
        equipeExterieurId = id;
        equipeExterieurNom = nom; // Utiliser le nom depuis la base
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

    // N'ajouter les IDs d'équipes que s'ils existent
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
    // Rechercher le match existant
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

      // Vérifier si les données ont changé
      const hasChanged =
        existingData.date !== match.date ||
        existingData.heure !== match.heure ||
        existingData.scoreDomicile !== match.scoreDomicile ||
        existingData.scoreExterieur !== match.scoreExterieur ||
        existingData.statut !== match.statut ||
        JSON.stringify(existingData.detailSets) !== JSON.stringify(match.detailSets);

      if (hasChanged) {
        // Préparer les données de mise à jour
        const updateData: any = {
          date: match.date,
          heure: match.heure,
          statut: match.statut,
        };

        // Ajouter les scores uniquement s'ils existent
        if (match.scoreDomicile !== null) {
          updateData.scoreDomicile = match.scoreDomicile;
        }
        if (match.scoreExterieur !== null) {
          updateData.scoreExterieur = match.scoreExterieur;
        }
        if (match.detailSets !== null) {
          updateData.detailSets = match.detailSets;
        }

        // Ajouter les IDs d'équipes s'ils existent
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
  const logger = initLogger('update-matchs-n3');
  console.log(`📝 Logs enregistrés dans: ${logger.getLogFilePath()}\n`);

  try {
    console.log('🏐 Mise à jour des Matchs Nationale 3 Féminine\n');
    console.log('════════════════════════════════════════════════\n');

    // Vérifier l'environnement avant de continuer
    await verifyEnvironment();

    const url =
      'https://www.ffvbbeach.org/ffvbapp/resu/vbspo_calendrier.php?saison=2025%2F2026&codent=ABCCS&poule=3FB&division=&tour=&calend=COMPLET&x=20&y=18';

    // 1. Récupérer les équipes depuis Firebase
    const equipesMap = await getEquipesMap();

    // 2. Scraper les matchs
    const matchs = await scrapeMatchs(url, equipesMap);
    console.log(`\n✅ ${matchs.length} matchs trouvés\n`);

    if (matchs.length === 0) {
      console.log('⚠️  Aucun match trouvé, vérifiez la structure de la page');
      return;
    }

    // 3. Mettre à jour les matchs dans Firebase
    await updateMatchsInFirebase(matchs);

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
