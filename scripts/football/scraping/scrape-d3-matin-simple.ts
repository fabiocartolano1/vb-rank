// Run with: ts-node classement.ts
// All comments must be in English

import fetch from 'node-fetch';
import https from 'https';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const insecureAgent = new https.Agent({
  rejectUnauthorized: false, // allow self-signed certificates
});

initializeApp({
  credential: cert(require('../../../fufc-8c9fc-firebase-adminsdk-fbsvc-9022c2fe03.json')),
});
const db = getFirestore();

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
    rank: e.rank,
    team: e.equipe.short_name,
    points: e.point_count,
    played: e.total_games_count,
    wins: e.won_games_count,
    draws: e.draw_games_count,
    losses: e.lost_games_count,
    goals_for: e.goals_for_count,
    goals_against: e.goals_against_count,
    goal_diff: e.goals_diff,
    forfait: e.is_forfait,
  }));

  classement.sort((a: any, b: any) => a.rank - b.rank);

  console.log(classement);

  classement.forEach(async (eq: { team: string }) => {
    await db.collection('equipes').doc(eq.team.replace(/\//g, '-')).set({
      items: eq,
    });
  });
}

main().catch((err) => console.error(err));
