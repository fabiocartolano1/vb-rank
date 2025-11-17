/**
 * Wrapper Firestore qui utilise automatiquement Admin SDK si disponible,
 * sinon utilise le SDK client.
 *
 * Permet une transition en douceur vers Admin SDK.
 */

import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

let db: admin.firestore.Firestore | null = null;

/**
 * Initialise et retourne l'instance Firestore
 * Utilise Firebase Admin SDK pour contourner les règles de sécurité
 */
export function getFirestore(): admin.firestore.Firestore {
  if (db) {
    return db;
  }

  let serviceAccount: any;

  // Essayer FIREBASE_SERVICE_ACCOUNT_PROD d'abord (pour GitHub Actions et prod)
  if (process.env.FIREBASE_SERVICE_ACCOUNT_PROD) {
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_PROD);
      console.log('📁 Utilisation du service account PROD depuis variable d\'environnement');
    } catch (error) {
      console.error('❌ Erreur parsing FIREBASE_SERVICE_ACCOUNT_PROD');
    }
  }

  // Sinon essayer le fichier local service-account-prod.json
  if (!serviceAccount) {
    const filePath = path.join(process.cwd(), 'service-account-prod.json');
    if (fs.existsSync(filePath)) {
      serviceAccount = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      console.log('📁 Utilisation du service account PROD depuis fichier local');
    }
  }

  if (!serviceAccount) {
    throw new Error(
      '❌ Service account PROD non trouvé.\n' +
      'Pour utiliser ce script, vous devez soit :\n' +
      '1. Définir FIREBASE_SERVICE_ACCOUNT_PROD en variable d\'environnement\n' +
      '2. Créer un fichier service-account-prod.json à la racine du projet\n\n' +
      'Ce script utilise Firebase Admin SDK pour contourner les règles de sécurité Firestore.'
    );
  }

  // Initialiser Firebase Admin
  const app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  db = admin.firestore(app);
  console.log(`✅ Firebase Admin initialisé (projet: ${serviceAccount.project_id})\n`);

  return db;
}

// Export des types pour faciliter la migration
export type Firestore = admin.firestore.Firestore;
export type DocumentReference = admin.firestore.DocumentReference;
export type CollectionReference = admin.firestore.CollectionReference;
export type QuerySnapshot = admin.firestore.QuerySnapshot;
export type DocumentSnapshot = admin.firestore.DocumentSnapshot;
