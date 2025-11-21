// Run with: ts-node classement.ts
// All comments must be in English

import fetch from 'node-fetch';
import https from 'https';

const insecureAgent = new https.Agent({
  rejectUnauthorized: false, // allow self-signed certificates
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

  console.table(classement);
}

main().catch((err) => console.error(err));
