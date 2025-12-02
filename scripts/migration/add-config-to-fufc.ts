import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

// Importer l'environnement FUFC
const fufcEnv = require('../../src/environments/environment.fufc');

// Initialiser Firebase pour FUFC
const fufcApp = initializeApp(fufcEnv.environment.firebase, 'fufc');
const db = getFirestore(fufcApp);

// Document club
const clubData = {
  colors: {
    accent: "#764ba2",
    background: "#f8f9fa",
    primary: "#f762a6",
    secondary: "#764ba2",
    text: "#1a1a1a"
  },
  logo: "/logo-le-cres.ico",
  name: "Le Crès Volley-Ball",
  shortName: "Le Crès VB",
  teamKeywords: ["crès", "cres"]
};

// Document navigation
const navigationData = {
  navigation: {
    desktop: [
      {
        enabled: true,
        id: "classement",
        label: "Classement",
        route: "/classement"
      },
      {
        enabled: true,
        id: "matchs",
        label: "Tous les Matchs",
        route: "/matchs"
      },
      {
        enabled: true,
        id: "matchs-cres",
        label: "Nos Matchs",
        route: "/matchs-cres"
      },
      {
        enabled: true,
        id: "agenda",
        label: "Au Crès ce weekend",
        route: "/agenda"
      },
      {
        enabled: true,
        id: "about",
        label: "À propos",
        route: "/about"
      }
    ],
    mobile: [
      {
        enabled: true,
        id: "agenda",
        label: "Au Crès ce weekend",
        route: "/agenda"
      },
      {
        enabled: true,
        id: "classement",
        label: "Classement",
        route: "/classement"
      },
      {
        enabled: true,
        id: "matchs",
        label: "Tous les Matchs",
        route: "/matchs"
      },
      {
        enabled: false,
        id: "matchs-cres",
        label: "Nos Matchs",
        route: "/matchs-cres"
      },
      {
        enabled: true,
        id: "about",
        label: "À propos",
        route: "/about"
      }
    ]
  }
};

async function addConfigToFufc() {
  try {
    console.log('🔄 Ajout de la configuration dans FUFC...\n');

    // Ajouter le document club
    const clubRef = doc(db, 'config', 'club');
    await setDoc(clubRef, clubData);
    console.log('✅ Document "club" ajouté avec succès');
    console.log('   Données:', JSON.stringify(clubData, null, 2));

    // Ajouter le document navigation
    const navRef = doc(db, 'config', 'navigation');
    await setDoc(navRef, navigationData);
    console.log('\n✅ Document "navigation" ajouté avec succès');
    console.log('   Données:', JSON.stringify(navigationData, null, 2));

    console.log('\n🎉 Configuration ajoutée avec succès dans FUFC !');

  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout:', error);
    throw error;
  }
}

// Exécuter l'ajout
addConfigToFufc()
  .then(() => {
    console.log('✅ Script terminé');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur:', error);
    process.exit(1);
  });
