import { config } from 'dotenv';
import { resolve } from 'path';

// Charger les variables d'environnement depuis le fichier .env à la racine du projet
config({ path: resolve(__dirname, '../../.env') });

// Vérifier que toutes les variables requises sont présentes
const requiredEnvVars = [
  'FIREBASE_API_KEY',
  'FIREBASE_AUTH_DOMAIN',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_STORAGE_BUCKET',
  'FIREBASE_MESSAGING_SENDER_ID',
  'FIREBASE_APP_ID',
  'FIREBASE_MEASUREMENT_ID',
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(
      `❌ Variable d'environnement manquante: ${envVar}\n` +
      `   Assurez-vous que le fichier .env existe à la racine du projet et contient toutes les variables requises.\n` +
      `   Vous pouvez copier .env.example vers .env et remplir les valeurs.`
    );
  }
}

// Configuration Firebase exportée
export const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY!,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.FIREBASE_PROJECT_ID!,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.FIREBASE_APP_ID!,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID!,
};
