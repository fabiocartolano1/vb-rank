import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc } from 'firebase/firestore';
import { firebaseConfig } from '../config/firebase-config';

// Initialiser Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Définition des championnats
const championnats = [
  {
    id: 'regionale-2-m',
    nom: 'Régionale 2 M',
    url: '', // À renseigner par l'utilisateur
    equipe: 'Régionale 2 M'
  },
  {
    id: 'regionale-2-f',
    nom: 'Régionale 2 F',
    url: '', // À renseigner par l'utilisateur
    equipe: 'Régionale 2 F'
  },
  {
    id: 'prenationale-m',
    nom: 'Pré-nationale M',
    url: '', // À renseigner par l'utilisateur
    equipe: 'Pré-nationale M'
  },
  {
    id: 'prenationale-f',
    nom: 'Pré-nationale F',
    url: '', // À renseigner par l'utilisateur
    equipe: 'Pré-nationale F'
  },
  {
    id: 'nationale-3-f',
    nom: 'Nationale 3 F',
    url: '', // À renseigner par l'utilisateur
    equipe: 'Nationale 3 F'
  }
];

async function initChampionnats() {
  console.log('🏐 Initialisation des championnats dans Firebase...\n');

  try {
    for (const championnat of championnats) {
      const { id, ...data } = championnat;
      const docRef = doc(db, 'championnats', id);
      await setDoc(docRef, data);
      console.log(`✅ Championnat créé: ${championnat.nom} (ID: ${id})`);
    }

    console.log('\n✨ Tous les championnats ont été créés avec succès!');
    console.log('\n📝 N\'oubliez pas de renseigner les URLs de scraping dans Firebase Console.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
    process.exit(1);
  }
}

// Exécuter le script
initChampionnats();
