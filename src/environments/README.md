# Configuration des Environnements

Ce dossier contient les fichiers de configuration pour les différents environnements de l'application.

## Structure des fichiers

- **environment.example.ts** : Template de référence avec les clés à remplir
- **environment.ts** : Fichier de base (utilisé si aucune configuration spécifique n'est trouvée)
- **environment.development.ts** : Configuration pour l'environnement de développement
- **environment.production.ts** : Configuration pour l'environnement de production

## Configuration initiale

### 1. Créer vos fichiers d'environnement

Les fichiers `environment.ts`, `environment.development.ts` et `environment.production.ts` sont ignorés par Git pour protéger vos clés API.

Pour chaque environnement, copiez le template et remplissez avec vos clés Firebase :

```bash
# Copier le template pour l'environnement de développement
cp src/environments/environment.example.ts src/environments/environment.development.ts

# Copier le template pour l'environnement de production
cp src/environments/environment.example.ts src/environments/environment.production.ts
```

### 2. Obtenir vos clés Firebase

#### Pour l'environnement de développement :
1. Allez sur la [Console Firebase](https://console.firebase.google.com/)
2. Sélectionnez votre projet de développement (ou créez-en un nouveau)
3. Allez dans Paramètres du projet > Général
4. Dans "Vos applications", trouvez votre application Web
5. Copiez les valeurs de configuration

#### Pour l'environnement de production :
1. Créez un **nouveau projet Firebase** dédié à la production
2. Répétez les étapes ci-dessus pour obtenir les clés de production
3. Configurez les règles de sécurité Firestore appropriées pour la production

### 3. Remplir les fichiers de configuration

Éditez `environment.development.ts` et `environment.production.ts` avec vos vraies clés :

```typescript
export const environment = {
  production: false, // true pour production
  firebase: {
    apiKey: 'VOTRE_CLE_API',
    authDomain: 'VOTRE_AUTH_DOMAIN',
    projectId: 'VOTRE_PROJECT_ID',
    storageBucket: 'VOTRE_STORAGE_BUCKET',
    messagingSenderId: 'VOTRE_MESSAGING_SENDER_ID',
    appId: 'VOTRE_APP_ID',
    measurementId: 'VOTRE_MEASUREMENT_ID',
  },
};
```

## Utilisation

### Lancer l'application en développement

```bash
npm start
# ou
ng serve
```

Par défaut, cela utilisera **environment.development.ts**.

### Build pour la production

```bash
npm run build
# ou
ng build --configuration production
```

Cela utilisera **environment.production.ts**.

### Build pour le développement

```bash
ng build --configuration development
```

Cela utilisera **environment.development.ts**.

## Bonnes pratiques

### Sécurité
- ⚠️ **Ne JAMAIS commiter les fichiers d'environnement avec des clés réelles**
- Utilisez des projets Firebase séparés pour dev et prod
- Configurez des règles de sécurité strictes en production
- Limitez les domaines autorisés dans la console Firebase

### Organisation
- **Développement** : Base de données de test, règles moins strictes
- **Production** : Base de données réelle, règles de sécurité strictes

### Règles Firestore recommandées

#### Développement (plus permissif)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

#### Production (strict)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /equipes/{equipeId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
    match /matchs/{matchId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
    match /championnats/{championnatId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
  }
}
```

## Dépannage

### Erreur : "environment.ts not found"
Assurez-vous d'avoir créé le fichier `environment.development.ts` ou `environment.production.ts` selon votre environnement.

### Les modifications ne sont pas prises en compte
Redémarrez le serveur de développement après avoir modifié un fichier d'environnement.

### Vérifier quel environnement est utilisé
Dans votre code, vous pouvez vérifier :
```typescript
import { environment } from '../environments/environment';

console.log('Production mode:', environment.production);
console.log('Project ID:', environment.firebase.projectId);
```
