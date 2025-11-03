import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';

// Configuration Firebase
const firebaseConfig = {
  apiKey: 'AIzaSyAVyJsXC8G6C-U4zVJY74ipXPBA8xE0hbM',
  authDomain: 'vb-rank.firebaseapp.com',
  projectId: 'vb-rank',
  storageBucket: 'vb-rank.firebasestorage.app',
  messagingSenderId: '359434513058',
  appId: '1:359434513058:web:82616930a7644cce0345fb',
  measurementId: 'G-DGTX5LPX5C',
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

interface Equipe {
  id: string;
  nom: string;
  logoUrl: string;
  championnatId: string;
}

// Normaliser le nom d'une équipe pour la comparaison
function normalizeTeamName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Enlever les accents
    .replace(/[^a-z0-9]/g, '') // Enlever tout sauf lettres et chiffres
    .trim();
}

// Vérifier si deux noms d'équipes sont similaires
function areTeamNamesSimilar(name1: string, name2: string): boolean {
  const norm1 = normalizeTeamName(name1);
  const norm2 = normalizeTeamName(name2);

  // Si les noms normalisés sont identiques
  if (norm1 === norm2) {
    return true;
  }

  // Si un nom contient l'autre (pour gérer "LE CRES" vs "LE CRES VBC")
  if (norm1.includes(norm2) || norm2.includes(norm1)) {
    // S'assurer que la différence n'est pas trop grande (pour éviter les faux positifs)
    const minLength = Math.min(norm1.length, norm2.length);
    const maxLength = Math.max(norm1.length, norm2.length);

    // Si le nom le plus court fait au moins 70% du plus long
    if (minLength / maxLength >= 0.7) {
      return true;
    }
  }

  // Calculer la distance de Levenshtein pour des matchs plus flexibles
  const distance = levenshteinDistance(norm1, norm2);
  const maxLength = Math.max(norm1.length, norm2.length);

  // Si la similarité est supérieure à 80%
  return distance / maxLength < 0.2;
}

// Calculer la distance de Levenshtein entre deux chaînes
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

// Récupérer toutes les équipes d'un championnat
async function getEquipesByChampionnatIds(championnatIds: string[]): Promise<Equipe[]> {
  const equipes: Equipe[] = [];

  for (const championnatId of championnatIds) {
    const q = query(
      collection(db, 'equipes'),
      where('championnatId', '==', championnatId)
    );
    const snapshot = await getDocs(q);

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      equipes.push({
        id: doc.id,
        nom: data.nom,
        logoUrl: data.logoUrl,
        championnatId: data.championnatId,
      });
    });
  }

  return equipes;
}

// Trouver une équipe régionale correspondante
function findMatchingRegionaleEquipe(
  targetEquipe: Equipe,
  regionaleEquipes: Equipe[]
): Equipe | undefined {
  return regionaleEquipes.find((regEquipe) =>
    areTeamNamesSimilar(targetEquipe.nom, regEquipe.nom)
  );
}

// Mettre à jour le logo d'une équipe
async function updateEquipeLogo(equipeId: string, newLogoUrl: string): Promise<void> {
  const docRef = doc(db, 'equipes', equipeId);
  await updateDoc(docRef, { logoUrl: newLogoUrl });
}

async function main() {
  try {
    console.log('🏐 Synchronisation des logos des équipes régionales vers pré-nat/N3\n');

    // 1. Récupérer toutes les équipes régionales (F et M)
    console.log('📥 Récupération des équipes régionales...');
    const regionaleEquipes = await getEquipesByChampionnatIds([
      'regionale-2-f',
      'regionale-2-m',
    ]);
    console.log(`✅ ${regionaleEquipes.length} équipes régionales trouvées\n`);

    // 2. Récupérer toutes les équipes pré-nat et N3
    console.log('📥 Récupération des équipes pré-nat et N3...');
    const higherLevelEquipes = await getEquipesByChampionnatIds([
      'prenationale-m',
      'prenationale-f',
      'nationale-3-f',
    ]);
    console.log(`✅ ${higherLevelEquipes.length} équipes pré-nat/N3 trouvées\n`);

    if (regionaleEquipes.length === 0) {
      console.log('⚠️  Aucune équipe régionale trouvée. Vérifiez que vous avez importé les équipes régionales.');
      return;
    }

    if (higherLevelEquipes.length === 0) {
      console.log('⚠️  Aucune équipe pré-nat/N3 trouvée. Vérifiez que vous avez importé ces équipes.');
      return;
    }

    // 3. Pour chaque équipe pré-nat/N3, chercher une équipe régionale correspondante
    console.log('🔍 Recherche des correspondances et mise à jour des logos...\n');
    let updatedCount = 0;
    let notFoundCount = 0;

    for (const higherEquipe of higherLevelEquipes) {
      const matchingRegionale = findMatchingRegionaleEquipe(higherEquipe, regionaleEquipes);

      if (matchingRegionale) {
        // Vérifier si le logo est différent avant de mettre à jour
        if (higherEquipe.logoUrl !== matchingRegionale.logoUrl) {
          await updateEquipeLogo(higherEquipe.id, matchingRegionale.logoUrl);
          console.log(
            `✅ ${higherEquipe.nom} (${higherEquipe.championnatId}) ← ${matchingRegionale.nom} (${matchingRegionale.championnatId})`
          );
          updatedCount++;
        } else {
          console.log(
            `⏭️  ${higherEquipe.nom} (${higherEquipe.championnatId}) : logo déjà identique`
          );
        }
      } else {
        console.log(`❌ ${higherEquipe.nom} (${higherEquipe.championnatId}) : pas de correspondance trouvée`);
        notFoundCount++;
      }
    }

    console.log('\n📊 Résumé:');
    console.log(`  - Logos mis à jour: ${updatedCount}`);
    console.log(`  - Pas de correspondance: ${notFoundCount}`);
    console.log(`  - Total équipes pré-nat/N3: ${higherLevelEquipes.length}`);

    console.log('\n🎉 Synchronisation terminée avec succès !');
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
