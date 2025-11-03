# Guide des Environnements - VB Rank

Ce projet utilise deux environnements distincts pour séparer les données de développement et de production.

## 🎯 Aperçu rapide

| Environnement | Commande | Fichier de config | Usage |
|---------------|----------|-------------------|-------|
| **Development** | `npm start` | `environment.development.ts` | Tests locaux, développement |
| **Production** | `npm run build` | `environment.production.ts` | Déploiement final |

## 🚀 Configuration initiale (IMPORTANT)

### Étape 1 : Créer vos projets Firebase

Vous avez besoin de **deux projets Firebase séparés** :

1. **Projet de développement** : Pour les tests et le développement
   - Nom suggéré : `vb-rank-dev`
   - Règles Firestore plus permissives

2. **Projet de production** : Pour l'application en ligne
   - Nom suggéré : `vb-rank-prod`
   - Règles Firestore strictes

### Étape 2 : Obtenir les clés de configuration

Pour chaque projet :

1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Sélectionnez votre projet
3. Cliquez sur l'icône ⚙️ (Paramètres) > Paramètres du projet
4. Dans la section "Vos applications", sélectionnez votre app Web
5. Copiez les valeurs de configuration Firebase

### Étape 3 : Configurer les fichiers d'environnement

Les fichiers suivants sont déjà créés mais contiennent des valeurs factices :

#### Pour le développement

Éditez : `src/environments/environment.development.ts`

```typescript
export const environment = {
  production: false,
  firebase: {
    apiKey: 'VOTRE_CLE_API_DEV',
    authDomain: 'vb-rank-dev.firebaseapp.com',
    projectId: 'vb-rank-dev',
    storageBucket: 'vb-rank-dev.firebasestorage.app',
    messagingSenderId: 'VOTRE_SENDER_ID',
    appId: 'VOTRE_APP_ID',
    measurementId: 'VOTRE_MEASUREMENT_ID',
  },
};
```

#### Pour la production

Éditez : `src/environments/environment.production.ts`

```typescript
export const environment = {
  production: true,
  firebase: {
    apiKey: 'VOTRE_CLE_API_PROD',
    authDomain: 'vb-rank-prod.firebaseapp.com',
    projectId: 'vb-rank-prod',
    storageBucket: 'vb-rank-prod.firebasestorage.app',
    messagingSenderId: 'VOTRE_SENDER_ID',
    appId: 'VOTRE_APP_ID',
    measurementId: 'VOTRE_MEASUREMENT_ID',
  },
};
```

⚠️ **IMPORTANT** : Ces fichiers sont ignorés par Git pour protéger vos clés API.

## 💻 Utilisation quotidienne

### Développement local

```bash
# Lancer le serveur de développement
npm start

# Ou explicitement
ng serve --configuration development
```

L'application sera accessible sur `http://localhost:4200` et utilisera votre base de données de développement.

### Build de production

```bash
# Build optimisé pour la production
npm run build

# Ou explicitement
ng build --configuration production
```

Le build sera dans le dossier `dist/vb-rank-app/`.

### Déploiement sur Firebase Hosting

```bash
# Build et déploiement en production
npm run build
firebase deploy --only hosting

# Pour déployer sur le projet de développement
firebase use vb-rank-dev  # Changer de projet
firebase deploy --only hosting
```

## 🔒 Sécurité

### Règles Firestore recommandées

#### Développement (permissif pour les tests)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read: if true;
      allow write: if true;  // Plus permissif pour les tests
    }
  }
}
```

#### Production (strict et sécurisé)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Collections publiques en lecture seule
    match /equipes/{equipeId} {
      allow read: if true;
      allow write: if false;  // Modification uniquement via l'admin
    }

    match /matchs/{matchId} {
      allow read: if true;
      allow write: if false;
    }

    match /championnats/{championnatId} {
      allow read: if true;
      allow write: if false;
    }
  }
}
```

### Bonnes pratiques

✅ **À faire :**
- Utiliser des projets Firebase séparés pour dev et prod
- Ne JAMAIS commiter les fichiers d'environnement avec de vraies clés
- Tester en développement avant de déployer en production
- Configurer des règles de sécurité strictes en production
- Limiter les domaines autorisés dans la console Firebase

❌ **À ne PAS faire :**
- Utiliser la même base de données pour dev et prod
- Commiter les clés API dans Git
- Déployer en production sans tester
- Laisser des règles permissives en production

## 📊 Gestion des données

### Données de test (Développement)

Vous pouvez créer des données de test dans votre base de développement sans crainte :

```typescript
// Exemples de données de test
const equipeTest = {
  nom: "Test Team",
  logoUrl: "https://example.com/logo.png",
  championnatId: "test-championship",
  victoires: 5,
  defaites: 3
};
```

### Migration des données

Pour copier les données de dev vers prod :

1. Utilisez la console Firebase pour exporter/importer
2. Ou créez un script de migration personnalisé
3. **Vérifiez toujours** les données avant de les importer en prod

## 🐛 Dépannage

### L'application ne démarre pas

```bash
# Vérifiez que le fichier d'environnement existe
ls src/environments/environment.development.ts

# Si absent, copiez depuis l'exemple
cp src/environments/environment.example.ts src/environments/environment.development.ts
```

### Erreur "Firebase: Firebase App named '[DEFAULT]' already exists"

Le fichier d'environnement est mal configuré. Vérifiez les clés Firebase.

### Les changements d'environnement ne sont pas pris en compte

Redémarrez le serveur de développement :

```bash
# Arrêter (Ctrl+C)
# Relancer
npm start
```

## 📝 Vérification de l'environnement

Pour vérifier quel environnement est utilisé, ajoutez temporairement dans votre code :

```typescript
import { environment } from './environments/environment';

console.log('🔧 Environment:', environment.production ? 'PRODUCTION' : 'DEVELOPMENT');
console.log('🔥 Firebase Project:', environment.firebase.projectId);
```

## 🔗 Ressources

- [Documentation Firebase](https://firebase.google.com/docs)
- [Angular Environments](https://angular.dev/tools/cli/environments)
- [Guide de sécurité Firestore](https://firebase.google.com/docs/firestore/security/get-started)

---

**Note** : Pour plus de détails techniques, consultez `src/environments/README.md`
