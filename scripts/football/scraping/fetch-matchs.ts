// Run with: npx tsx fetch-matchs.ts
// All comments must be in English

import https from 'https';

const insecureAgent = new https.Agent({
  rejectUnauthorized: false,
});

interface MatchRaw {
  date: string;
  cj_no: number;
  type: string;
  home_team: { short_name: string };
  away_team: { short_name: string };
  home_score: number | null;
  away_score: number | null;
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
      res = await fetch(url, {
        // @ts-ignore - agent is not in standard fetch but works in Node.js
        agent: insecureAgent
      });
    } catch (e) {
      console.log('Network error:', e);
      break;
    }

    if (!res.ok) {
      console.log('HTTP error:', res.status);
      break;
    }

    const json: any = await res.json();

    // Log the raw response to understand the structure
    if (page === 1) {
      console.log('Raw API response (first 2 items):');
      console.log(JSON.stringify({
        ...json,
        'hydra:member': json['hydra:member']?.slice(0, 2)
      }, null, 2));
    }

    const list: MatchRaw[] = json['hydra:member'];
    if (!list || list.length === 0) {
      console.log('No more matches found, stopping at page', page);
      break;
    }

    for (const m of list) {
      all.push({
        date: m.date,
        day: m.cj_no,
        type: m.type,
        home: m.home_team?.short_name ?? '?',
        away: m.away_team?.short_name ?? '?',
        score:
          m.home_score != null && m.away_score != null ? `${m.home_score} - ${m.away_score}` : '-',
        forfait: m.is_forfait,
      });
    }

    page++;
  }

  return all;
}

async function main() {
  const matches = await fetchAllMatches();
  console.log('\n\nMatches found:');
  console.table(matches);
}

main().catch((err) => console.error(err));
