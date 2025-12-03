// Smart Update pour D3 Matin FUFC avec Firebase Client SDK
// Run with: set FIREBASE_PROJECT_ID=fufc-8c9fc && NODE_TLS_REJECT_UNAUTHORIZED=0 && npm run smart:update:fufc

import fetch from 'node-fetch';
import https from 'https';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where, doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';

// FUFC Firebase config
const fufcConfig = {
  apiKey: 'AIzaSyCGsb39fQM7qdaY_oTEQfw0ex-jJPAfv_U',
  authDomain: 'fufc-8c9fc.firebaseapp.com',
  projectId: 'fufc-8c9fc',
  storageBucket: 'fufc-8c9fc.firebasestorage.app',
  messagingSenderId: '702980907146',
  appId: '1:702980907146:web:9086aa0ab1ef3851be8d73',
  measurementId: 'G-J9ZRZTVZ92',
};

const fufcApp = initializeApp(fufcConfig, 'fufc');
const db = getFirestore(fufcApp);

const insecureAgent = new https.Agent({
  rejectUnauthorized: false,
});

async function fetchInsecure(url: string) {
  return fetch(url, { agent: insecureAgent });
}

async function fetchClassement(): Promise<any[]> {
  console.log('📥 Récupération du classement depuis l\'API FFF...\n');
  const url = 'https://api-dofa.fff.fr/api/compets/440939/phases/1/poules/3/classement_journees?page=1';

  const res = await fetchInsecure(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch classement: ${res.status}`);
  }

  const json: any = await res.json();
  const list = json['hydra:member'] || [];

  const classement = list.map((e: any) => ({
    nom: e.equipe.short_name,
    rang: e.rank,
    points: e.point_count,
    joues: e.total_games_count,
    gagnes: e.won_games_count,
    nuls: e.draw_games_count,
    perdus: e.lost_games_count,
    setsPour: e.goals_for_count,
    setsContre: e.goals_against_count,
  }));

  console.log(`✅ ${classement.length} équipes récupérées\n`);
  return classement;
}

async function fetchAllMatches(): Promise<any[]> {
  console.log('📥 Récupération des matchs depuis l\'API FFF...\n');
  const baseUrl = 'https://api-dofa.fff.fr/api/compets/440939/phases/1/poules/3/matchs';
  let page = 1;
  let allMatches: any[] = [];
  let hasMorePages = true;

  while (hasMorePages) {
    const url = `${baseUrl}?page=${page}`;
    console.log(`   Page ${page}...`);

    const res = await fetchInsecure(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch page ${page}: ${res.status}`);
    }

    const json: any = await res.json();
    const matches = json['hydra:member'];

    if (!matches || matches.length === 0) {
      hasMorePages = false;
    } else {
      allMatches = allMatches.concat(matches);
      page++;
    }
  }

  console.log(`✅ ${allMatches.length} matchs récupérés\n`);
  return allMatches;
}

async function updateClassementInFirebase(classement: any[]): Promise<void> {
  console.log('💾 Mise à jour du classement dans Firebase...\n');

  let updated = 0;
  let unchanged = 0;
  let notFound = 0;

  for (const item of classement) {
    const teamName = item.nom;
    if (!teamName) continue;

    // Chercher l'équipe par nom
    const equipesRef = collection(db, 'equipes');
    const equipesQuery = query(equipesRef, where('nom', '==', teamName));
    const equipesSnapshot = await getDocs(equipesQuery);

    if (!equipesSnapshot.empty) {
      const equipeDoc = equipesSnapshot.docs[0];
      const existingData = equipeDoc.data();

      const hasChanged =
        existingData.rang !== item.rang ||
        existingData.points !== item.points ||
        existingData.joues !== item.joues ||
        existingData.gagnes !== item.gagnes ||
        existingData.nuls !== item.nuls ||
        existingData.perdus !== item.perdus ||
        existingData.setsPour !== item.setsPour ||
        existingData.setsContre !== item.setsContre;

      if (hasChanged) {
        await updateDoc(equipeDoc.ref, {
          rang: item.rang,
          points: item.points,
          joues: item.joues,
          gagnes: item.gagnes,
          nuls: item.nuls,
          perdus: item.perdus,
          setsPour: item.setsPour,
          setsContre: item.setsContre,
        });

        console.log(`✅ ${teamName} - Rang ${item.rang}, ${item.points} pts`);
        updated++;
      } else {
        unchanged++;
      }
    } else {
      console.log(`⚠️  ${teamName} - Équipe non trouvée`);
      notFound++;
    }
  }

  console.log(`\n📊 Classement:`);
  console.log(`   ${updated} équipe(s) mise(s) à jour`);
  console.log(`   ${unchanged} équipe(s) inchangée(s)`);
  if (notFound > 0) {
    console.log(`   ${notFound} équipe(s) non trouvée(s)`);
  }
  console.log('');
}

async function updateMatchsInFirebase(matches: any[]): Promise<void> {
  console.log('💾 Mise à jour des matchs dans Firebase...\n');

  const championnatsRef = collection(db, 'championnats');
  const q = query(championnatsRef, where('nom', '==', 'D3 Matin'));
  const championnatsSnapshot = await getDocs(q);

  if (championnatsSnapshot.empty) {
    console.log('❌ Championnat D3 Matin non trouvé');
    return;
  }

  const championnatId = championnatsSnapshot.docs[0].id;
  let updated = 0;
  let unchanged = 0;

  for (const rawMatch of matches) {
    const equipeDomicile = rawMatch.home?.short_name || 'Équipe inconnue';
    const equipeExterieur = rawMatch.away?.short_name || 'Équipe inconnue';
    const journee = rawMatch.poule_journee?.number || 0;

    // Chercher le match existant
    const matchsRef = collection(db, 'matchs');
    const matchQuery = query(
      matchsRef,
      where('championnatId', '==', championnatId),
      where('journee', '==', journee),
      where('equipeDomicile', '==', equipeDomicile),
      where('equipeExterieur', '==', equipeExterieur)
    );
    const existingMatchs = await getDocs(matchQuery);

    if (!existingMatchs.empty) {
      const matchDoc = existingMatchs.docs[0];
      const existingData = matchDoc.data();

      const scoreDomicile = rawMatch.home_score !== null ? rawMatch.home_score : undefined;
      const scoreExterieur = rawMatch.away_score !== null ? rawMatch.away_score : undefined;
      const statut = (rawMatch.status === 'A' && scoreDomicile !== undefined) ? 'termine' : 'a_venir';
      const heure = rawMatch.time ? rawMatch.time.replace('H', ':') : undefined;

      const hasChanged =
        existingData.scoreDomicile !== scoreDomicile ||
        existingData.scoreExterieur !== scoreExterieur ||
        existingData.statut !== statut ||
        existingData.heure !== heure;

      if (hasChanged) {
        const updateData: any = {
          statut: statut,
        };

        if (heure) updateData.heure = heure;
        if (scoreDomicile !== undefined) updateData.scoreDomicile = scoreDomicile;
        if (scoreExterieur !== undefined) updateData.scoreExterieur = scoreExterieur;

        await updateDoc(matchDoc.ref, updateData);

        const scoreInfo = scoreDomicile !== undefined && scoreExterieur !== undefined
          ? ` - Score: ${scoreDomicile}-${scoreExterieur}`
          : '';
        console.log(`✅ J${journee}: ${equipeDomicile} vs ${equipeExterieur}${scoreInfo}`);
        updated++;
      } else {
        unchanged++;
      }
    }
  }

  console.log(`\n📊 Résumé:`);
  console.log(`   ${updated} match(s) mis à jour`);
  console.log(`   ${unchanged} match(s) inchangé(s)`);
}

async function main() {
  const startTime = Date.now();

  try {
    console.log('⚽ Mise à jour D3 Matin FUFC\n');
    console.log('════════════════════════════════════════════════\n');

    // Récupérer et mettre à jour le classement
    const classement = await fetchClassement();
    await updateClassementInFirebase(classement);

    // Récupérer et mettre à jour les matchs
    const matches = await fetchAllMatches();
    await updateMatchsInFirebase(matches);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n⏱️  Temps d'exécution: ${duration}s`);
    console.log('\n🎉 Mise à jour terminée avec succès !');
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
