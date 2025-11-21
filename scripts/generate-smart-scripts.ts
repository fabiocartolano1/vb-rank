import * as fs from 'fs';
import * as path from 'path';

interface ChampionnatConfig {
  code: string;
  championnatId: string;
  nom: string;
  stateKey: string;
}

const championnats: ChampionnatConfig[] = [
  // Déjà fait: N3
  { code: 'r2m', championnatId: 'regionale-2-m', nom: 'Régionale 2 Masculine', stateKey: 'r2m' },
  { code: 'pnf', championnatId: 'prenationale-f', nom: 'Pré-Nationale Féminine', stateKey: 'pnf' },
  { code: 'pnm', championnatId: 'prenationale-m', nom: 'Pré-Nationale Masculine', stateKey: 'pnm' },
  { code: 'r2f', championnatId: 'regionale-2-f', nom: 'Régionale 2 Féminine', stateKey: 'r2f' },
  { code: 'm18m', championnatId: 'moins-18-m', nom: 'Moins 18 Masculine', stateKey: 'm18m' },
  { code: 'bfc', championnatId: 'benjamines-f-comite', nom: 'Benjamines F Comité', stateKey: 'bfc' },
  { code: 'bmb', championnatId: 'benjamins-m-bronze', nom: 'Benjamins M Bronze', stateKey: 'bmb' },
  { code: 'cfd', championnatId: 'cadettes-f-departement', nom: 'Cadettes F Département', stateKey: 'cfd' },
  { code: 'mfd', championnatId: 'minimes-f-departement', nom: 'Minimes F Département', stateKey: 'mfd' },
  { code: 'mmb', championnatId: 'minimes-m-bronze', nom: 'Minimes M Bronze', stateKey: 'mmb' }
];

function generateSmartMatchsScript(config: ChampionnatConfig): string {
  const codeUpper = config.code.toUpperCase();

  return `import { initializeApp } from 'firebase/app';
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
const STATE_KEY = '${config.stateKey}-matchs';

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
    throw new Error(\`HTTP error! status: \${response.status}\`);
  }
  const buffer = await response.arrayBuffer();
  const decoder = new TextDecoder('iso-8859-1');
  return decoder.decode(buffer);
}

async function getEquipesMap(): Promise<Map<string, string>> {
  console.log('📥 Récupération des équipes ${codeUpper} depuis Firebase...');
  const equipesQuery = query(
    collection(db, 'equipes'),
    where('championnatId', '==', '${config.championnatId}')
  );
  const equipesSnapshot = await getDocs(equipesQuery);

  const map = new Map<string, string>();
  equipesSnapshot.forEach((doc) => {
    const data = doc.data();
    map.set(data.nom, doc.id);
  });

  console.log(\`✅ \${map.size} équipes trouvées\\n\`);
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

    const journeeMatch = rowText.match(/Journ[ée]+\\s+(\\d+)/i);
    if (journeeMatch) {
      currentJournee = parseInt(journeeMatch[1]);
      console.log(\`  📅 Journée \${currentJournee}\`);
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
        .map((s) => s.trim().replace(/\\s+/g, ':'));
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
    const date = \`20\${dateArray[2]}-\${dateArray[1]}-\${dateArray[0]}\`;

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
      championnatId: '${config.championnatId}',
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
  console.log('\\n💾 Mise à jour des matchs dans Firebase...');

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

        const statusChange = existingData.statut !== match.statut ? \` (\${existingData.statut} → \${match.statut})\` : '';
        const scoreChange = match.scoreDomicile !== null && match.scoreExterieur !== null
          ? \` - Score: \${match.scoreDomicile}-\${match.scoreExterieur}\`
          : '';
        console.log(\`✅ J\${match.journee}: \${match.equipeDomicile} vs \${match.equipeExterieur}\${statusChange}\${scoreChange}\`);
        updated++;
      } else {
        unchanged++;
      }
    } else {
      console.log(\`⚠️  J\${match.journee}: \${match.equipeDomicile} vs \${match.equipeExterieur} - Match non trouvé dans la base de données\`);
      notFound++;
    }
  }

  console.log('\\n📊 Résumé de la mise à jour :');
  console.log(\`   ✅ \${updated} match(s) mis à jour\`);
  console.log(\`   ⏭️  \${unchanged} match(s) inchangé(s)\`);
  if (notFound > 0) {
    console.log(\`   ⚠️  \${notFound} match(s) non trouvé(s)\`);
  }
}

async function verifyEnvironment(): Promise<void> {
  console.log('🔍 Vérification de l\\'environnement...');

  const projectId = firebaseConfig.projectId;
  console.log(\`   Projet Firebase: \${projectId}\`);

  const validProjects = ['vb-rank', 'le-cres-vb'];
  if (!validProjects.some(p => projectId.includes(p))) {
    throw new Error('⚠️  ATTENTION: Le projet Firebase ne semble pas être valide !');
  }

  const isProd = projectId.includes('le-cres-vb');
  console.log(\`   Environnement: \${isProd ? 'production' : 'développement'}\`);

  console.log('✅ Environnement vérifié\\n');
}

async function main() {
  const logger = initLogger('smart-update-matchs-${config.code}');
  console.log(\`📝 Logs enregistrés dans: \${logger.getLogFilePath()}\\n\`);

  try {
    console.log('🏐 Mise à jour SMART des Matchs ${config.nom}\\n');
    console.log('════════════════════════════════════════════════\\n');

    await verifyEnvironment();

    // NOTE: L'URL doit être récupérée depuis le script update-matchs-${config.code}.ts original
    console.error('❌ ERREUR: URL manquante - Veuillez copier l\\'URL depuis update-matchs-${config.code}.ts');
    process.exit(1);
  } catch (error) {
    console.error('\\n❌ Erreur:', error);
    throw error;
  }
}

main()
  .then(() => {
    console.log('\\n✅ Script terminé');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\\n❌ Erreur fatale:', error);
    process.exit(1);
  });
`;
}

function generateSmartClassementScript(config: ChampionnatConfig): string {
  const codeUpper = config.code.toUpperCase();

  return `import { initializeApp } from 'firebase/app';
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
const STATE_KEY = '${config.stateKey}-classement';

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
    throw new Error(\`HTTP error! status: \${response.status}\`);
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
              console.log(\`  \${rang}. \${nom} - \${points} pts\`);
            }
          }
        });
    }
  });

  return equipes;
}

async function updateEquipesInFirebase(equipes: EquipeData[]): Promise<void> {
  console.log('\\n💾 Mise à jour des équipes dans Firebase...');

  let updated = 0;
  let notFound = 0;
  let unchanged = 0;

  for (const equipe of equipes) {
    const q = query(
      collection(db, 'equipes'),
      where('nom', '==', equipe.nom),
      where('championnatId', '==', '${config.championnatId}')
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

        console.log(\`✅ \${equipe.nom} - Mise à jour : Rang \${existingData.rang} → \${equipe.rang}, Points \${existingData.points} → \${equipe.points}\`);
        updated++;
      } else {
        console.log(\`⏭️  \${equipe.nom} - Aucun changement\`);
        unchanged++;
      }
    } else {
      console.log(\`⚠️  \${equipe.nom} - Équipe non trouvée dans la base de données\`);
      notFound++;
    }
  }

  console.log('\\n📊 Résumé de la mise à jour :');
  console.log(\`   ✅ \${updated} équipe(s) mise(s) à jour\`);
  console.log(\`   ⏭️  \${unchanged} équipe(s) inchangée(s)\`);
  if (notFound > 0) {
    console.log(\`   ⚠️  \${notFound} équipe(s) non trouvée(s)\`);
  }
}

async function verifyEnvironment(): Promise<void> {
  console.log('🔍 Vérification de l\\'environnement...');

  const projectId = firebaseConfig.projectId;
  console.log(\`   Projet Firebase: \${projectId}\`);

  const validProjects = ['vb-rank', 'le-cres-vb'];
  if (!validProjects.some(p => projectId.includes(p))) {
    throw new Error('⚠️  ATTENTION: Le projet Firebase ne semble pas être valide !');
  }

  const isProd = projectId.includes('le-cres-vb');
  console.log(\`   Environnement: \${isProd ? 'production' : 'développement'}\`);

  console.log('✅ Environnement vérifié\\n');
}

async function main() {
  const logger = initLogger('smart-update-classement-${config.code}');
  console.log(\`📝 Logs enregistrés dans: \${logger.getLogFilePath()}\\n\`);

  try {
    console.log('🏐 Mise à jour SMART du Classement ${config.nom}\\n');
    console.log('════════════════════════════════════════════════\\n');

    await verifyEnvironment();

    // NOTE: L'URL doit être récupérée depuis le script update-classement-${config.code}.ts original
    console.error('❌ ERREUR: URL manquante - Veuillez copier l\\'URL depuis update-classement-${config.code}.ts');
    process.exit(1);
  } catch (error) {
    console.error('\\n❌ Erreur:', error);
    throw error;
  }
}

main()
  .then(() => {
    console.log('\\n✅ Script terminé');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\\n❌ Erreur fatale:', error);
    process.exit(1);
  });
`;
}

// Générer tous les scripts
const updateDir = path.join(__dirname, 'update');

console.log('🚀 Génération des scripts smart...\n');

for (const config of championnats) {
  // Script matchs
  const matchsPath = path.join(updateDir, `smart-update-matchs-${config.code}.ts`);
  fs.writeFileSync(matchsPath, generateSmartMatchsScript(config));
  console.log(`✅ Créé: smart-update-matchs-${config.code}.ts`);

  // Script classement
  const classementPath = path.join(updateDir, `smart-update-classement-${config.code}.ts`);
  fs.writeFileSync(classementPath, generateSmartClassementScript(config));
  console.log(`✅ Créé: smart-update-classement-${config.code}.ts`);
}

console.log('\n🎉 Tous les scripts smart ont été générés !');
console.log('\n⚠️  IMPORTANT: Vous devez maintenant copier les URLs depuis les scripts originaux');
console.log('   vers les nouveaux scripts smart (remplacer la ligne avec console.error)');
