// Script to scrape D3 Matin standings and save to FUFC Firebase

import fetch from 'node-fetch';
import https from 'https';
import admin from 'firebase-admin';

// Force FUFC project connection
const app = admin.initializeApp({
  projectId: 'fufc-8c9fc'
});
const db = admin.firestore(app);

const insecureAgent = new https.Agent({
  rejectUnauthorized: false,
});

async function fetchInsecure(url: string) {
  return fetch(url, { agent: insecureAgent });
}

async function main() {
  const url =
    'https://api-dofa.fff.fr/api/compets/440939/phases/1/poules/3/classement_journees?page=1';

  const res = await fetchInsecure(url);
  if (!res.ok) {
    throw new Error('API request failed: ' + res.status);
  }

  const json = await res.json();
  const list = json['hydra:member'];

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
    logoUrl: '',
    goalDiff: e.goals_diff,
    forfait: e.is_forfait,
  }));

  classement.sort((a: any, b: any) => a.rang - b.rang);

  console.log(classement);

  // Get D3 Matin championship ID
  const championnatsSnapshot = await db.collection('championnats').where('nom', '==', 'D3 Matin').get();
  let championnatId = '';

  if (!championnatsSnapshot.empty) {
    championnatId = championnatsSnapshot.docs[0].id;
    console.log(`✅ Championnat trouvé: ${championnatId}`);
  } else {
    console.log('❌ Championnat D3 Matin non trouvé');
    return;
  }

  // Save teams with championnatId
  for (const eq of classement) {
    const equipeData = {
      ...eq,
      championnatId: championnatId,
    };
    await db.collection('equipes').doc(eq.nom.replace(/\//g, '-')).set(equipeData);
    console.log(`✅ Équipe sauvegardée: ${eq.nom}`);
  }

  console.log('\n🎉 Scraping terminé !');
  await app.delete();
}

main().catch((err) => console.error(err));
