import admin from 'firebase-admin';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Obtenir le chemin du répertoire courant en mode ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger les variables d'environnement depuis le fichier .env à la racine du projet
const envPath = resolve(__dirname, '../../.env');
config({ path: envPath, override: true });

// Initialiser Firebase Admin SDK
let app: admin.app.App;

export function initializeFirebaseAdmin(): admin.app.App {
  // Si l'app est déjà initialisée, la retourner
  if (app) {
    return app;
  }

  try {
    // Vérifier si FIREBASE_SERVICE_ACCOUNT_JSON existe
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

    if (serviceAccountJson) {
      // Utiliser le service account JSON (pour GitHub Actions)
      const serviceAccount = JSON.parse(serviceAccountJson);

      app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id
      });

      console.log(`🔥 Firebase Admin SDK initialisé avec service account: ${serviceAccount.project_id}`);
    } else {
      // Fallback pour développement local : utiliser FIREBASE_PROJECT_ID depuis .env
      const projectId = process.env.FIREBASE_PROJECT_ID;

      if (!projectId) {
        throw new Error('❌ FIREBASE_SERVICE_ACCOUNT_JSON ou FIREBASE_PROJECT_ID doit être défini');
      }

      // Initialiser avec Application Default Credentials ou sans credentials (mode développement)
      // Note: En production, cela échouera car les règles Firestore interdisent les écritures
      app = admin.initializeApp({
        projectId: projectId
      });

      console.log(`🔥 Firebase Admin SDK initialisé en mode développement: ${projectId}`);
      console.log(`⚠️  Note: En production, FIREBASE_SERVICE_ACCOUNT_JSON est requis pour contourner les règles de sécurité`);
    }

    return app;
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation de Firebase Admin SDK:', error);
    throw error;
  }
}

// Fonction utilitaire pour obtenir Firestore
export function getFirestoreAdmin(): admin.firestore.Firestore {
  const app = initializeFirebaseAdmin();
  return admin.firestore(app);
}

// Fonction utilitaire pour obtenir l'app
export function getFirebaseApp(): admin.app.App {
  return initializeFirebaseAdmin();
}
