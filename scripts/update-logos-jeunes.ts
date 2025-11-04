import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';

// Import environnement DEV
const devEnv = require('../src/environments/environment.development');

// Initialiser Firebase
const app = initializeApp(devEnv.environment.firebase);
const db = getFirestore(app);

// IDs des championnats jeunes et adultes
const JEUNES_IDS = ['m18-m', 'bfc', 'bmb', 'mfd', 'mmb', 'cfd'];
const ADULTES_IDS = ['regionale-2-m', 'regionale-2-f', 'prenationale-m', 'prenationale-f', 'nationale-3-f'];

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

  // Si un nom contient l'autre (pour gérer "ASBAM" vs "ASBAM MONTPELLIER")
  if (norm1.includes(norm2) || norm2.includes(norm1)) {
    return true;
  }

  return false;
}

// Trouver une équipe adulte correspondante
function findMatchingAdulteEquipe(
  jeuneEquipe: Equipe,
  adultesEquipes: Equipe[]
): Equipe | undefined {
  return adultesEquipes.find((adulteEquipe) =>
    areTeamNamesSimilar(jeuneEquipe.nom, adulteEquipe.nom)
  );
}

async function main() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  🎨 Synchronisation logos adultes → jeunes                ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Récupérer toutes les équipes adultes
  console.log('📥 Récupération des équipes adultes...');
  const adultesEquipes: Equipe[] = [];

  for (const championnatId of ADULTES_IDS) {
    const q = query(collection(db, 'equipes'), where('championnatId', '==', championnatId));
    const snapshot = await getDocs(q);

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      adultesEquipes.push({
        id: doc.id,
        nom: data.nom,
        logoUrl: data.logoUrl,
        championnatId: data.championnatId,
      });
    });
  }

  console.log(`✅ ${adultesEquipes.length} équipes adultes trouvées\n`);

  if (adultesEquipes.length === 0) {
    console.log('⚠️  Aucune équipe adulte trouvée.');
    process.exit(1);
  }

  let totalUpdated = 0;
  let totalNotFound = 0;

  // Pour chaque championnat jeunes
  for (const championnatId of JEUNES_IDS) {
    console.log(`\n📋 Championnat: ${championnatId.toUpperCase()}`);
    console.log('─'.repeat(60));

    // Récupérer toutes les équipes jeunes du championnat
    const q = query(collection(db, 'equipes'), where('championnatId', '==', championnatId));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.log(`  ⚠️  Aucune équipe trouvée`);
      continue;
    }

    console.log(`  📥 ${snapshot.size} équipes trouvées\n`);

    const jeunesEquipes: Equipe[] = [];
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      jeunesEquipes.push({
        id: doc.id,
        nom: data.nom,
        logoUrl: data.logoUrl,
        championnatId: data.championnatId,
      });
    });

    // Mettre à jour chaque équipe jeune
    let updated = 0;
    let notFound = 0;

    for (const jeuneEquipe of jeunesEquipes) {
      const matchingAdulte = findMatchingAdulteEquipe(jeuneEquipe, adultesEquipes);

      if (matchingAdulte) {
        // Vérifier si le logo est différent
        if (jeuneEquipe.logoUrl !== matchingAdulte.logoUrl) {
          const docRef = doc(db, 'equipes', jeuneEquipe.id);
          await updateDoc(docRef, { logoUrl: matchingAdulte.logoUrl });
          console.log(`  ✅ ${jeuneEquipe.nom} ← ${matchingAdulte.nom} (${matchingAdulte.championnatId})`);
          updated++;
        } else {
          console.log(`  ⏭️  ${jeuneEquipe.nom} → logo déjà identique`);
        }
      } else {
        console.log(`  ❌ ${jeuneEquipe.nom} → pas de correspondance trouvée`);
        notFound++;
      }
    }

    console.log(`\n  📊 ${updated} logos mis à jour, ${notFound} non trouvés sur ${jeunesEquipes.length}`);
    totalUpdated += updated;
    totalNotFound += notFound;
  }

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  📊 Résumé                                                 ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  console.log(`✅ Logos mis à jour: ${totalUpdated}`);
  console.log(`❌ Pas de correspondance: ${totalNotFound}`);
  console.log(`📦 Championnats jeunes traités: ${JEUNES_IDS.length}`);

  console.log('\n✨ Synchronisation terminée!\n');
  process.exit(0);
}

main().catch((error) => {
  console.error('\n❌ Erreur:', error);
  process.exit(1);
});
