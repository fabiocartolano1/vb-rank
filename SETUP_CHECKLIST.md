# ✅ Checklist de Configuration - Environnements Firebase

## 🎯 Ce qui a été fait automatiquement

- ✅ Création de `environment.development.ts` avec les clés actuelles
- ✅ Création de `environment.production.ts` avec des valeurs placeholder
- ✅ Configuration d'Angular pour utiliser les bons fichiers selon l'environnement
- ✅ Mise à jour du `.gitignore` pour protéger les clés sensibles
- ✅ Documentation complète créée

## 📋 Ce que VOUS devez faire maintenant

### Étape 1 : Créer un projet Firebase de production

1. Allez sur https://console.firebase.google.com/
2. Cliquez sur "Ajouter un projet"
3. Nommez-le (suggestion : `vb-rank-prod`)
4. Suivez les étapes de création

### Étape 2 : Obtenir les clés Firebase de production

1. Dans votre nouveau projet de production, cliquez sur l'icône Web (</>)
2. Enregistrez votre application
3. Copiez les valeurs de configuration Firebase

### Étape 3 : Configurer environment.production.ts

Éditez le fichier : `src/environments/environment.production.ts`

Remplacez les valeurs `YOUR_PROD_*` par vos vraies clés :

```typescript
export const environment = {
  production: true,
  firebase: {
    apiKey: 'COLLER_ICI',           // ← De la console Firebase
    authDomain: 'COLLER_ICI',        // ← De la console Firebase
    projectId: 'COLLER_ICI',         // ← De la console Firebase
    storageBucket: 'COLLER_ICI',     // ← De la console Firebase
    messagingSenderId: 'COLLER_ICI', // ← De la console Firebase
    appId: 'COLLER_ICI',             // ← De la console Firebase
    measurementId: 'COLLER_ICI',     // ← De la console Firebase
  },
};
```

### Étape 4 : Créer la base de données Firestore (Production)

1. Dans la console Firebase de votre projet de **production**
2. Allez dans "Firestore Database"
3. Cliquez sur "Créer une base de données"
4. Choisissez **"Mode production"** (règles strictes)
5. Sélectionnez la région (Europe par exemple)

### Étape 5 : Configurer les règles Firestore (Production)

Dans l'onglet "Règles" de Firestore, utilisez :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /equipes/{equipeId} {
      allow read: if true;
      allow write: if false;
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

**Important** : Ces règles rendent la base **en lecture seule** pour sécuriser la production. Vous devrez ajouter des données manuellement ou via un script admin.

### Étape 6 : (Optionnel) Configurer Firebase Hosting pour la production

Si vous voulez déployer sur Firebase Hosting :

```bash
# Installer Firebase CLI si pas déjà fait
npm install -g firebase-tools

# Se connecter à Firebase
firebase login

# Initialiser Firebase dans le projet
firebase init hosting

# Sélectionner votre projet de production
firebase use --add
# Alias: production
# Projet: vb-rank-prod (ou votre nom)

# Pour déployer
npm run build
firebase deploy --only hosting
```

## 🧪 Tester la configuration

### Test en développement

```bash
npm start
```

Vérifiez dans la console du navigateur :
- Aucune erreur Firebase
- Le `projectId` affiché correspond à votre projet de dev

### Test du build production

```bash
npm run build
```

Le build doit réussir sans erreur.

## 📝 Structure finale des fichiers

```
src/environments/
├── environment.example.ts       # Template de référence
├── environment.ts              # Base (ignoré par Git) ⚠️
├── environment.development.ts  # DEV (ignoré par Git) ⚠️
├── environment.production.ts   # PROD (ignoré par Git) ⚠️
└── README.md                   # Documentation technique

ENVIRONMENTS.md                 # Ce guide
```

## 🔐 Sécurité - Points de vigilance

### ✅ Bon à savoir
- Les fichiers `environment.*.ts` ne seront **jamais** commitées dans Git
- Vous devez recréer ces fichiers sur chaque nouvelle machine
- Gardez vos clés Firebase en sécurité (Password manager, etc.)

### ⚠️ À NE JAMAIS FAIRE
- Commiter un fichier d'environnement avec de vraies clés
- Utiliser les mêmes clés pour dev et prod
- Laisser des règles permissives en production

## 🚨 En cas de problème

### "Cannot find module './environments/environment'"

Solution :
```bash
# Copiez l'exemple vers le fichier manquant
cp src/environments/environment.example.ts src/environments/environment.development.ts
```

### "Firebase: No Firebase App '[DEFAULT]' has been created"

Vérifiez que le fichier d'environnement contient les bonnes clés Firebase.

### Le build échoue avec des erreurs d'environnement

Assurez-vous que `environment.production.ts` existe et contient les vraies clés.

## 📚 Documentation complète

Pour plus d'informations, consultez :
- **ENVIRONMENTS.md** : Guide complet d'utilisation
- **src/environments/README.md** : Documentation technique détaillée

---

**Temps estimé pour configurer** : 15-20 minutes

Une fois cette checklist complétée, vous aurez deux environnements totalement séparés ! 🎉
