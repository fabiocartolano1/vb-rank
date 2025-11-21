import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Obtenir le chemin du répertoire courant en mode ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger les variables d'environnement depuis le fichier .env à la racine du projet
config({ path: resolve(__dirname, '../../.env') });

// Configurations Firebase disponibles
const firebaseConfigs = {
  prod: {
    // Le Crès VB - Production
    apiKey: process.env.FIREBASE_API_KEY_PROD!,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN_PROD!,
    projectId: process.env.FIREBASE_PROJECT_ID_PROD!,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET_PROD!,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID_PROD!,
    appId: process.env.FIREBASE_APP_ID_PROD!,
    measurementId: process.env.FIREBASE_MEASUREMENT_ID_PROD!,
  },
  dev: {
    // VB Rank - Test/Dev
    apiKey: process.env.FIREBASE_API_KEY!,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN!,
    projectId: process.env.FIREBASE_PROJECT_ID!,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET!,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID!,
    appId: process.env.FIREBASE_APP_ID!,
    measurementId: process.env.FIREBASE_MEASUREMENT_ID!,
  },
  fufc: {
    // FUFC
    apiKey: process.env.FIREBASE_API_KEY_FUFC!,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN_FUFC!,
    projectId: process.env.FIREBASE_PROJECT_ID_FUFC!,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET_FUFC!,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID_FUFC!,
    appId: process.env.FIREBASE_APP_ID_FUFC!,
    measurementId: process.env.FIREBASE_MEASUREMENT_ID_FUFC!,
  }
};

// Déterminer quel environnement utiliser (par défaut: dev)
const environment = process.env.FIREBASE_ENV || 'dev';

// Vérifier que l'environnement existe
if (!firebaseConfigs[environment as keyof typeof firebaseConfigs]) {
  throw new Error(
    `Environnement Firebase invalide: ${environment}\n` +
    `Environnements disponibles: ${Object.keys(firebaseConfigs).join(', ')}\n` +
    `Définissez FIREBASE_ENV dans votre fichier .env`
  );
}

// Configuration Firebase exportée
export const firebaseConfig = firebaseConfigs[environment as keyof typeof firebaseConfigs];

console.log(`🔥 Environnement Firebase: ${environment} (${firebaseConfig.projectId})`);
