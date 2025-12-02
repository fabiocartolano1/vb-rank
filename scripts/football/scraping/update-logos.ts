// Script to fetch team logos from FFF API and update FUFC database
// Run with: npx tsx scripts/football/scraping/update-logos.ts

import fetch from 'node-fetch';
import https from 'https';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';

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

// Initialize Firebase for FUFC
const fufcApp = initializeApp(fufcConfig, 'fufc');
const db = getFirestore(fufcApp);

const insecureAgent = new https.Agent({
  rejectUnauthorized: false,
});

async function fetchInsecure(url: string) {
  return fetch(url, { agent: insecureAgent });
}

async function main() {
  console.log('🔍 Récupération des logos depuis l\'API FFF...\n');

  // Fetch matches to get team logos
  const matchesUrl = 'https://api-dofa.fff.fr/api/compets/440939/phases/1/poules/3/matchs?page=1';
  const res = await fetchInsecure(matchesUrl);

  if (!res.ok) {
    throw new Error('Failed to fetch matches: ' + res.status);
  }

  const json = await res.json();
  const matches = json['hydra:member'];

  // Build a map of team name -> logo URL
  const logoMap = new Map<string, string>();

  for (const match of matches) {
    const homeName = match.home?.short_name;
    const homeLogo = match.home?.club?.logo;

    const awayName = match.away?.short_name;
    const awayLogo = match.away?.club?.logo;

    if (homeName && homeLogo) {
      logoMap.set(homeName, homeLogo);
    }

    if (awayName && awayLogo) {
      logoMap.set(awayName, awayLogo);
    }
  }

  console.log(`✅ ${logoMap.size} logos trouvés\n`);

  // Update teams in Firestore
  const equipesRef = collection(db, 'equipes');
  const equipesSnapshot = await getDocs(equipesRef);

  let updatedCount = 0;

  for (const docSnapshot of equipesSnapshot.docs) {
    const equipe = docSnapshot.data();
    const nom = equipe.nom;
    const logo = logoMap.get(nom);

    if (logo) {
      const equipeRef = doc(db, 'equipes', docSnapshot.id);
      await updateDoc(equipeRef, { logoUrl: logo });
      console.log(`✅ Logo mis à jour pour ${nom}`);
      console.log(`   ${logo}`);
      updatedCount++;
    } else {
      console.log(`⚠️  Pas de logo trouvé pour ${nom}`);
    }
  }

  console.log(`\n🎉 ${updatedCount} logo(s) mis à jour !`);
}

main().catch((err) => console.error(err));
