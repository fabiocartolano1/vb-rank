import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import * as cheerio from 'cheerio';
import { firebaseConfig } from '../../config/firebase-config';

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
  console.log('📥 Récupération des équipes PNM depuis Firebase...');
  const equipesQuery = query(
    collection(db, 'equipes'),
    where('championnatId', '==', 'prenationale-m')
  );
  const equipesSnapshot = await getDocs(equipesQuery);

  const map = new Map<string, string>();
  equipesSnapshot.forEach((doc) => {
    const data = doc.data();
    map.set(data.nom, doc.id);
  });

  console.log(`✅ ${map.size} équipes trouvées`);
  console.log('📋 Équipes en base:');
  Array.from(map.keys()).forEach((nom) => {
    console.log(`  - "${nom}" (normalisé: "${normalizeTeamName(nom)}")`);
  });
  console.log();
  return map;
}

function normalizeTeamName(name: string): string {
  // Normaliser les noms d'équipes pour matcher ceux en base
  return name.trim().toUpperCase();
}

function parseScore(
  scoreText: string
): { domicile?: number; exterieur?: number; sets?: string[] } | null {
  // Format: "3 - 0" ou "3 - 1 (25-20, 25-18, 25-22)" etc.
  const scoreMatch = scoreText.match(/(\d+)\s*-\s*(\d+)/);
  if (!scoreMatch) return null;

  const result: any = {
    domicile: parseInt(scoreMatch[1]),
    exterieur: parseInt(scoreMatch[2]),
  };

  // Essayer de récupérer le détail des sets entre parenthèses
  const setsMatch = scoreText.match(/\(([^)]+)\)/);
  if (setsMatch) {
    const setsText = setsMatch[1];
    result.sets = setsText.split(/[,;]/).map((s) => s.trim().replace(/\s+/g, ':'));
  }

  return result;
}

async function scrapeMatchs(url: string, equipesMap: Map<string, string>): Promise<Match[]> {
  console.log('📥 Récupération de la page des matchs...');
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
      console.log(`\n📅 Journée ${currentJournee}`);
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
    let scoreText = '';
    let scoreDomicile = '';
    let scoreExterieur = '';
    let sets: string[] = [];
    let statut = 'a_venir';
    if (matchPlayed) {
      scoreText = $(cells[2]).text().trim();
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

    // Parser la date
    //const dateMatch = dateHeureText.match(/(\d{2})\/(\d{2})\/(\d{4})/);
    //if (!dateMatch) return;

    const dateArray = dateText.split('/');
    const date = `20${dateArray[2]}-${dateArray[1]}-${dateArray[0]}`;

    // Parser l'heure
    //const heureMatch = dateHeureText.match(/(\d{2}):(\d{2})/);
    //const heure = heureMatch ? `${heureMatch[1]}:${heureMatch[2]}` : undefined;

    // Parser le score
    //const scoreData = parseScore(scoreText);
    //const statut: 'termine' | 'a_venir' = scoreData ? 'termine' : 'a_venir';

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

    // Debug: afficher les matchs non linkés
    if (!equipeDomicileId) {
      console.log(`  ⚠️  Équipe domicile non trouvée: "${equipeDomicile}" (normalisé: "${nomDomicileNorm}")`);
    }
    if (!equipeExterieurId) {
      console.log(`  ⚠️  Équipe extérieur non trouvée: "${equipeExterieur}" (normalisé: "${nomExterieurNorm}")`);
    }

    const match: any = {
      championnatId: 'prenationale-m',
      journee: currentJournee,
      date,
      heure: heureText,
      equipeDomicile: equipeDomicileNom, // Utiliser le nom depuis la base
      equipeExterieur: equipeExterieurNom, // Utiliser le nom depuis la base
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
    // const statusIcon = statut === 'termine' ? '✅' : '⏰';
    const scoreDisplay = scoreDomicile ? `${scoreDomicile}-${scoreExterieur}` : 'à venir';
    // console.log(`  ${statusIcon} ${equipeDomicile} vs ${equipeExterieur} (${scoreDisplay})`);
  });

  return matchs;
}

async function saveMatchsToFirebase(matchs: Match[]): Promise<void> {
  console.log('\n💾 Sauvegarde des matchs dans Firebase...');
  let count = 0;

  for (const match of matchs) {
    await addDoc(collection(db, 'matchs'), match);
    count++;
    if (count % 10 === 0) {
      console.log(`  ${count}/${matchs.length} matchs sauvegardés...`);
    }
  }

  console.log(`✅ ${count} matchs sauvegardés`);
}

async function main() {
  try {
    console.log('🏐 Scraping des matchs Prénat M\n');

    const url =
      'https://www.ffvbbeach.org/ffvbapp/resu/vbspo_calendrier.php?saison=2025/2026&codent=LILR&poule=PMA';

    // 1. Récupérer les équipes depuis Firebase
    const equipesMap = await getEquipesMap();

    // 2. Scraper les matchs
    const matchs = await scrapeMatchs(url, equipesMap);
    console.log(`\n✅ ${matchs.length} matchs trouvés`);

    // 3. Sauvegarder les matchs
    if (matchs.length > 0) {
      //console.log(matchs);
      await saveMatchsToFirebase(matchs);
    }

    console.log('\n🎉 Scraping terminé avec succès !');
    console.log(`📊 ${matchs.length} matchs importés pour Régionale 2 F`);
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
