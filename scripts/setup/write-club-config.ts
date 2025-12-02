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

// Configuration du club
const clubConfig = {
  name: 'Le Crès Volley-Ball',
  shortName: 'Le Crès VB',
  logo: '/logo-le-cres.ico',
  colors: {
    primary: '#F762A6',
    secondary: '#667eea',
    accent: '#764ba2',
    background: '#f8f9fa',
    text: '#1a1a1a'
  },
  teamKeywords: ['crès', 'cres']
};

async function writeClubConfig() {
  try {
    console.log('Écriture de la configuration du club dans Firestore...');
    console.log('Document: config/club');

    const configRef = doc(db, 'config', 'club');
    await setDoc(configRef, clubConfig);

    console.log('✅ Configuration du club écrite avec succès !');
    console.log('Configuration:', JSON.stringify(clubConfig, null, 2));

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Erreur lors de l\'écriture de la configuration du club:');
    console.error('Message:', error.message);
    console.error('Code:', error.code);
    process.exit(1);
  }
}

writeClubConfig();
