import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Obtenir le chemin du répertoire courant en mode ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger les variables d'environnement depuis le fichier .env à la racine du projet
// override: true pour forcer l'écrasement des variables d'environnement système
const envPath = resolve(__dirname, '../../.env');
config({ path: envPath, override: true });

// Configuration Firebase - Le Crès VB (Production uniquement)
export const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY!,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.FIREBASE_PROJECT_ID!,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.FIREBASE_APP_ID!,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID!,
};

console.log(`🔥 Firebase: ${firebaseConfig.projectId}`);
