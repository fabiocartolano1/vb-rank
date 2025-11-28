import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
const serviceAccount = {
  projectId: 'le-cres-vb',
};

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: 'le-cres-vb',
});

const db = admin.firestore();

// Configuration des onglets
const config = {
  navigation: {
    desktop: [
      { id: 'classement', label: 'Classement', route: '/classement', enabled: true },
      { id: 'matchs', label: 'Tous les Matchs', route: '/matchs', enabled: true },
      { id: 'matchs-cres', label: 'Nos Matchs', route: '/matchs-cres', enabled: true },
      { id: 'agenda', label: 'Au Crès ce weekend', route: '/agenda', enabled: true },
      { id: 'instagram', label: 'Actu', route: '/instagram', enabled: true },
      { id: 'about', label: 'À propos', route: '/about', enabled: true }
    ],
    mobile: [
      { id: 'classement', label: 'Classement', route: '/classement', enabled: true },
      { id: 'matchs', label: 'Tous les Matchs', route: '/matchs', enabled: true },
      { id: 'matchs-cres', label: 'Nos Matchs', route: '/matchs-cres', enabled: false },
      { id: 'agenda', label: 'Au Crès ce weekend', route: '/agenda', enabled: true },
      { id: 'instagram', label: 'Actu', route: '/instagram', enabled: true },
      { id: 'about', label: 'À propos', route: '/about', enabled: true }
    ]
  }
};

async function writeConfig() {
  try {
    console.log('Écriture de la configuration dans Firestore...');

    const configRef = db.collection('config').doc('navigation');
    await configRef.set(config);

    console.log('✅ Configuration écrite avec succès !');
    console.log('Configuration:', JSON.stringify(config, null, 2));

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de l\'écriture de la configuration:', error);
    process.exit(1);
  }
}

writeConfig();
