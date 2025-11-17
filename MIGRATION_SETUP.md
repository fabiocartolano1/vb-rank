# Configuration de la migration Dev vers Prod

Ce guide explique comment configurer les Service Accounts Firebase pour permettre à GitHub Actions d'effectuer des migrations entre environnements.

## Prérequis

- Accès administrateur aux projets Firebase Dev et Prod
- Accès aux paramètres secrets du repository GitHub

## Étape 1 : Créer les Service Accounts Firebase

### Pour l'environnement DEV

1. Allez sur la [Console Firebase](https://console.firebase.google.com/)
2. Sélectionnez votre projet **DEV**
3. Cliquez sur l'icône ⚙️ (Paramètres du projet)
4. Allez dans l'onglet **Comptes de service**
5. Cliquez sur **Générer une nouvelle clé privée**
6. Téléchargez le fichier JSON (ex: `vb-rank-dev-service-account.json`)

### Pour l'environnement PROD

1. Répétez les mêmes étapes pour votre projet **PROD**
2. Téléchargez le fichier JSON (ex: `vb-rank-prod-service-account.json`)

## Étape 2 : Ajouter les secrets dans GitHub

1. Allez sur votre repository GitHub
2. Cliquez sur **Settings** → **Secrets and variables** → **Actions**
3. Cliquez sur **New repository secret**

### Secret 1 : FIREBASE_SERVICE_ACCOUNT_DEV

- **Name:** `FIREBASE_SERVICE_ACCOUNT_DEV`
- **Secret:** Copiez-collez tout le contenu du fichier JSON DEV (le JSON complet)

### Secret 2 : FIREBASE_SERVICE_ACCOUNT_PROD

- **Name:** `FIREBASE_SERVICE_ACCOUNT_PROD`
- **Secret:** Copiez-collez tout le contenu du fichier JSON PROD (le JSON complet)

## Étape 3 : Installer les dépendances

Si vous n'avez pas encore firebase-admin :

```bash
npm install firebase-admin
```

## Étape 4 : Tester en local (optionnel)

Pour tester la migration en local avant de lancer le workflow GitHub Actions :

1. Créez deux variables d'environnement avec les contenus des service accounts :

```bash
# Windows PowerShell
$env:FIREBASE_SERVICE_ACCOUNT_DEV='{"type":"service_account",...}'
$env:FIREBASE_SERVICE_ACCOUNT_PROD='{"type":"service_account",...}'

# Linux/Mac
export FIREBASE_SERVICE_ACCOUNT_DEV='{"type":"service_account",...}'
export FIREBASE_SERVICE_ACCOUNT_PROD='{"type":"service_account",...}'
```

2. Lancez le script :

```bash
npm run migrate:dev-to-prod:admin
```

## Étape 5 : Lancer la migration via GitHub Actions

1. Allez sur votre repository GitHub
2. Cliquez sur **Actions**
3. Sélectionnez le workflow **Migrate Dev to Prod**
4. Cliquez sur **Run workflow**
5. Dans le champ de confirmation, tapez exactement : `CONFIRMER`
6. Cliquez sur **Run workflow**

## Sécurité

- ⚠️ **NE JAMAIS** committer les fichiers JSON des service accounts dans le repository
- ⚠️ Les service accounts ont un accès complet à vos projets Firebase
- ⚠️ Gardez ces fichiers en lieu sûr et supprimez-les après configuration des secrets GitHub
- ✅ Les secrets GitHub sont chiffrés et ne sont jamais exposés dans les logs

## Permissions requises

Le Service Account a automatiquement les permissions suivantes :
- Lecture/Écriture complète sur Firestore
- Contourne les règles de sécurité Firestore
- Accès administrateur au projet Firebase

## Dépannage

### Erreur "Service account not found"
- Vérifiez que les secrets GitHub sont bien nommés `FIREBASE_SERVICE_ACCOUNT_DEV` et `FIREBASE_SERVICE_ACCOUNT_PROD`
- Vérifiez que le contenu JSON est valide (pas de caractères échappés en trop)

### Erreur "Permission denied"
- Vérifiez que le service account a bien été généré depuis la console Firebase
- Le fichier JSON doit contenir `type: "service_account"`

### Erreur lors de l'installation de firebase-admin
- Assurez-vous d'avoir Node.js 18+ installé
- Essayez `npm install firebase-admin --force`

## Scripts disponibles

- `npm run migrate:dev-to-prod` - Migration avec SDK client (nécessite authentification)
- `npm run migrate:dev-to-prod:admin` - Migration avec SDK Admin (pour GitHub Actions)
- `npm run migrate:prod-to-dev` - Migration inverse (Prod vers Dev)

## Différences entre les deux scripts

| Caractéristique | migrate-dev-to-prod.ts | migrate-dev-to-prod-admin.ts |
|----------------|------------------------|------------------------------|
| SDK utilisé | Firebase Client | Firebase Admin |
| Authentification | Nécessite login utilisateur | Service Account |
| Règles de sécurité | Respectées | Contournées (accès admin) |
| Utilisation | Locale / développement | GitHub Actions / Production |
| Configuration | Fichiers environment | Variables d'environnement |
