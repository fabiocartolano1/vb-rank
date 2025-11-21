// Run with: ts-node matchs.ts
// All comments must be in English

import fetch from 'node-fetch';
import https from 'https';

const insecureAgent = new https.Agent({
  rejectUnauthorized: false, // allow self-signed certificates
});

async function fetchInsecure(url: string) {
  return fetch(url, { agent: insecureAgent });
}

interface MatchRaw {
  date: string;
  cj_no: number;
  type: string;
  home_team: { short_name: string };
  away_team: { short_name: string };
  home_goals: number | null;
  away_goals: number | null;
  is_forfait: boolean;
}

interface MatchRow {
  date: string;
  day: number;
  type: string;
  home: string;
  away: string;
  score: string;
  forfait: boolean;
}

async function fetchAllMatches() {
  const all: MatchRow[] = [];
  let page = 1;

  while (true) {
    const url = `https://api-dofa.fff.fr/api/compets/440939/phases/1/poules/3/matchs?page=${page}`;

    let res;
    try {
      res = await fetchInsecure(url);
    } catch (e) {
      break; // network or TLS error -> stop
    }

    if (!res.ok) break;

    const json = await res.json();

    const list: MatchRaw[] = json['hydra:member'];
    if (!list || list.length === 0) break;

    for (const m of list) {
      all.push({
        date: m.date,
        day: m.cj_no,
        type: m.type,
        home: m.home_team?.short_name ?? '?',
        away: m.away_team?.short_name ?? '?',
        score:
          m.home_goals != null && m.away_goals != null ? `${m.home_goals} - ${m.away_goals}` : '-',
        forfait: m.is_forfait,
      });
    }

    page++;
  }

  return all;
}

async function main() {
  const matches = await fetchAllMatches();
  console.table(matches);
}

main().catch((err) => console.error(err));
