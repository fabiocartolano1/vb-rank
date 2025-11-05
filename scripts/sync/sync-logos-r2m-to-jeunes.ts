import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';

// Import environnement DEV
const devEnv = require('../src/environments/environment.development');

// Initialiser Firebase
const app = initializeApp(devEnv.environment.firebase);
const db = getFirestore(app);

// IDs des championnats jeunes
const JEUNES_IDS = ['m18-m', 'bfc', 'bmb', 'mfd', 'mmb', 'cfd'];
const R2M_ID = 'regionale-2-m';

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

// Trouver une équipe R2M correspondante
function findMatchingR2MEquipe(
  jeuneEquipe: Equipe,
  r2mEquipes: Equipe[]
): Equipe | undefined {
  return r2mEquipes.find((r2mEquipe) =>
    areTeamNamesSimilar(jeuneEquipe.nom, r2mEquipe.nom)
  );
}

async function main() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  🎨 Synchronisation logos R2M → jeunes                    ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Récupérer toutes les équipes R2M
  console.log('📥 Récupération des équipes R2M...');
  const r2mEquipes: Equipe[] = [];

  const q = query(collection(db, 'equipes'), where('championnatId', '==', R2M_ID));
  const snapshot = await getDocs(q);

  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    r2mEquipes.push({
      id: doc.id,
      nom: data.nom,
      logoUrl: data.logoUrl,
      championnatId: data.championnatId,
    });
  });

  console.log(`✅ ${r2mEquipes.length} équipes R2M trouvées\n`);

  if (r2mEquipes.length === 0) {
    console.log('⚠️  Aucune équipe R2M trouvée.');
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
      const matchingR2M = findMatchingR2MEquipe(jeuneEquipe, r2mEquipes);

      if (matchingR2M) {
        // Vérifier si le logo est différent
        if (jeuneEquipe.logoUrl !== matchingR2M.logoUrl) {
          const docRef = doc(db, 'equipes', jeuneEquipe.id);
          await updateDoc(docRef, { logoUrl: matchingR2M.logoUrl });
          console.log(`  ✅ ${jeuneEquipe.nom} ← ${matchingR2M.nom}`);
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
