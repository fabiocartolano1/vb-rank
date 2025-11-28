import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyD44NkDD3qfYlyQx30thD17-_O834Lc4i4',
  authDomain: 'le-cres-vb.firebaseapp.com',
  projectId: 'le-cres-vb',
  storageBucket: 'le-cres-vb.firebasestorage.app',
  messagingSenderId: '118100171401',
  appId: '1:118100171401:web:2a6071aa678d56a74a0458',
  measurementId: 'G-YEQPX8YMPV',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

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
      { id: 'matchs-cres', label: 'Nos Matchs', route: '/matchs-cres', enabled: false }, // Caché en mobile (classe hide-on-mobile)
      { id: 'agenda', label: 'Au Crès ce weekend', route: '/agenda', enabled: true },
      { id: 'instagram', label: 'Actu', route: '/instagram', enabled: true },
      { id: 'about', label: 'À propos', route: '/about', enabled: true }
    ]
  }
};

async function createConfigTable() {
  try {
    console.log('Création de la collection config dans Firestore...');

    const configRef = doc(db, 'config', 'navigation');
    await setDoc(configRef, config);

    console.log('✅ Configuration créée avec succès !');
    console.log('Configuration:', JSON.stringify(config, null, 2));

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de la création de la configuration:', error);
    process.exit(1);
  }
}

createConfigTable();
