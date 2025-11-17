import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

let app: admin.app.App | null = null;

/**
 * Initialise Firebase Admin SDK
 * Charge le service account depuis une variable d'environnement ou un fichier local
 */
export function initializeFirebaseAdmin(): admin.app.App {
  if (app) {
    return app;
  }

  let serviceAccount: any;

  // Essayer de charger depuis la variable d'environnement d'abord
  if (process.env.FIREBASE_SERVICE_ACCOUNT_PROD) {
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_PROD);
      console.log('📁 Service account chargé depuis FIREBASE_SERVICE_ACCOUNT_PROD');
    } catch (error) {
      console.error('❌ Erreur lors du parsing de FIREBASE_SERVICE_ACCOUNT_PROD:', error);
    }
  }

  // Sinon, essayer depuis un fichier local
  if (!serviceAccount) {
    const filePath = path.join(process.cwd(), 'service-account-prod.json');
    if (fs.existsSync(filePath)) {
      console.log('📁 Service account chargé depuis service-account-prod.json');
      serviceAccount = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
  }

  if (!serviceAccount) {
    throw new Error(
      'Service account non trouvé.\n' +
      'Définissez la variable d\'environnement FIREBASE_SERVICE_ACCOUNT_PROD ou créez service-account-prod.json'
    );
  }

  app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  console.log(`✅ Firebase Admin initialisé pour le projet: ${serviceAccount.project_id}`);
  return app;
}

/**
 * Retourne l'instance Firestore avec Firebase Admin SDK
 */
export function getAdminFirestore(): admin.firestore.Firestore {
  if (!app) {
    initializeFirebaseAdmin();
  }
  return admin.firestore(app!);
}
