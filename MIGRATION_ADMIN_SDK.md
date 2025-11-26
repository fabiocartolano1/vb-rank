# Migration vers Firebase Admin SDK

## Résumé des modifications

Tous les scripts smart-update ont été migrés du SDK client Firebase vers le SDK Admin Firebase pour contourner les règles de sécurité Firestore.

## Fichiers modifiés

### Nouveau fichier de configuration
- **`scripts/config/firebase-admin-config.ts`** : Configuration du SDK Admin avec support du service account JSON

### Fichiers utilitaires
- **`scripts/utils/hash-detection.ts`** : Adapté pour utiliser l'API Admin SDK (au lieu du SDK client)

### Scripts smart-update convertis (11 fichiers)
- `scripts/volleyball/adultes/smart-update/smart-update-n3.ts`
- `scripts/volleyball/adultes/smart-update/smart-update-pnf.ts`
- `scripts/volleyball/adultes/smart-update/smart-update-pnm.ts`
- `scripts/volleyball/adultes/smart-update/smart-update-r2f.ts`
- `scripts/volleyball/adultes/smart-update/smart-update-r2m.ts`
- `scripts/volleyball/jeunes/smart-update/smart-update-bfc.ts`
- `scripts/volleyball/jeunes/smart-update/smart-update-bmb.ts`
- `scripts/volleyball/jeunes/smart-update/smart-update-cfd.ts`
- `scripts/volleyball/jeunes/smart-update/smart-update-m18m.ts`
- `scripts/volleyball/jeunes/smart-update/smart-update-mfd.ts`
- `scripts/volleyball/jeunes/smart-update/smart-update-mmb.ts`

### Workflow GitHub Actions
- **`.github/workflows/smart-update-all.yml`** : Utilise maintenant `FIREBASE_SERVICE_ACCOUNT_JSON` au lieu des variables d'environnement Firebase individuelles

## Changements techniques

### 1. Imports remplacés
**Avant (SDK Client) :**
```typescript
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
import { firebaseConfig } from '../../../config/firebase-config';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
```

**Après (SDK Admin) :**
```typescript
import { getFirestoreAdmin, getFirebaseApp } from '../../../config/firebase-admin-config';

const db = getFirestoreAdmin();
const app = getFirebaseApp();
```

### 2. API Firestore modifiée

**Requêtes de lecture :**
```typescript
// Avant
const championnatDoc = await getDocs(
  query(collection(db, 'championnats'), where('__name__', '==', championnatId))
);
if (championnatDoc.empty) { ... }
const url = championnatDoc.docs[0].data().url;

// Après
const championnatDoc = await db.collection('championnats').doc(championnatId).get();
if (!championnatDoc.exists) { ... }
const url = championnatDoc.data()?.url;
```

**Requêtes avec where :**
```typescript
// Avant
const equipesQuery = query(
  collection(db, 'equipes'),
  where('championnatId', '==', 'nationale-3-f')
);
const equipesSnapshot = await getDocs(equipesQuery);

// Après
const equipesSnapshot = await db
  .collection('equipes')
  .where('championnatId', '==', 'nationale-3-f')
  .get();
```

**Mises à jour :**
```typescript
// Avant
const equipeRef = doc(db, 'equipes', equipeId);
await updateDoc(equipeRef, { ... });

// Après
const equipeRef = db.collection('equipes').doc(equipeId);
await equipeRef.update({ ... });
```

## Configuration requise

### GitHub Actions (Production)
Vous devez configurer la variable secret `FIREBASE_SERVICE_ACCOUNT_JSON` dans GitHub :

1. Allez dans Firebase Console > Project Settings > Service Accounts
2. Générez une nouvelle clé privée
3. Copiez tout le contenu du fichier JSON
4. Dans GitHub : Settings > Secrets and variables > Actions > New repository secret
5. Nom : `FIREBASE_SERVICE_ACCOUNT_JSON`
6. Valeur : Collez le JSON complet

### Développement local
En local, le SDK Admin peut fonctionner de deux façons :

1. **Avec service account JSON** (recommandé pour les tests) :
   ```bash
   # Ajouter dans .env
   FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"...",...}'
   ```

2. **Sans service account** (mode développement) :
   - Le script utilisera `FIREBASE_PROJECT_ID` depuis le `.env`
   - Les écritures échoueront si les règles Firestore les interdisent
   - Utile uniquement pour tester la logique sans modifier la base

## Règles Firestore

Les nouvelles règles Firestore de l'environnement `le-cres-vb` :

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // Lecture publique pour tous les documents
    match /{document=**} {
      allow read: if true;
    }

    // Collection championnats - Écriture interdite (seulement via Admin SDK)
    match /championnats/{championnatId} {
      allow write: if false;

      match /equipes/{equipeId} {
        allow write: if false;
      }

      match /matchs/{matchId} {
        allow write: if false;
      }
    }

    // Collection scraping-state - Écriture interdite (seulement via Admin SDK)
    match /scraping-state/{stateId} {
      allow write: if false;
    }

    // Toute autre collection - Écriture interdite par défaut
    match /{collection}/{document} {
      allow write: if false;
    }
  }
}
```

Ces règles interdisent toute écriture depuis le SDK client, mais le SDK Admin les contourne avec le service account.

## Avantages de cette migration

1. **Sécurité renforcée** : Les écritures ne sont possibles que via le SDK Admin avec credentials valides
2. **Pas de modification de logique** : Seule la méthode de connexion a changé
3. **Cohérence** : Toutes les opérations d'écriture passent par le même mécanisme sécurisé
4. **Simplicité de déploiement** : Une seule variable secret au lieu de 7

## Tests

Pour tester localement (avec service account JSON) :
```bash
npm run smart:update:n3
```

Pour tester en production (GitHub Actions) :
- Push les changements sur la branche principale
- Vérifiez que le secret `FIREBASE_SERVICE_ACCOUNT_JSON` est bien configuré
- Le workflow s'exécutera automatiquement selon le planning
