# Scripts de Migration Firebase

## Test en local

Pour tester le script de migration en local :

### Option 1 : Utiliser des fichiers JSON (Recommandé)

1. Copiez vos fichiers service account dans la racine du projet :
   ```
   cp ~/Downloads/vb-rank-firebase-adminsdk-*.json service-account-dev.json
   cp ~/Downloads/le-cres-vb-firebase-adminsdk-*.json service-account-prod.json
   ```

2. Lancez le script :
   ```bash
   npm run migrate:dev-to-prod:admin
   ```

3. **IMPORTANT** : Supprimez les fichiers après le test :
   ```bash
   rm service-account-dev.json service-account-prod.json
   ```

### Option 2 : Utiliser des variables d'environnement

**Windows PowerShell :**
```powershell
$env:FIREBASE_SERVICE_ACCOUNT_DEV = Get-Content "C:\path\to\vb-rank-service-account.json" -Raw
$env:FIREBASE_SERVICE_ACCOUNT_PROD = Get-Content "C:\path\to\le-cres-vb-service-account.json" -Raw
npm run migrate:dev-to-prod:admin
```

**Linux/Mac :**
```bash
export FIREBASE_SERVICE_ACCOUNT_DEV=$(cat /path/to/vb-rank-service-account.json)
export FIREBASE_SERVICE_ACCOUNT_PROD=$(cat /path/to/le-cres-vb-service-account.json)
npm run migrate:dev-to-prod:admin
```

## GitHub Actions

Sur GitHub Actions, les service accounts sont automatiquement chargés depuis les secrets :
- `FIREBASE_SERVICE_ACCOUNT_DEV`
- `FIREBASE_SERVICE_ACCOUNT_PROD`

Consultez [MIGRATION_SETUP.md](../../MIGRATION_SETUP.md) pour la configuration complète.

## Sécurité

⚠️ **NE JAMAIS** commiter les fichiers service account !
- Les fichiers `*service-account*.json` sont automatiquement ignorés par Git
- Supprimez-les immédiatement après usage en local
