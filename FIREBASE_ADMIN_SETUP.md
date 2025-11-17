# Configuration Firebase Admin SDK

## Contexte

Les scripts de mise à jour utilisent maintenant **Firebase Admin SDK** au lieu du SDK client. Cela permet aux GitHub Actions d'écrire dans la base de données de production en contournant les règles de sécurité Firestore.

## Changements effectués

### 1. Scripts de mise à jour
Tous les scripts dans `scripts/update/` utilisent maintenant le wrapper Firestore :

```typescript
// Avant (SDK Client)
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Après (SDK Admin via wrapper)
import { getFirestore } from '../config/firestore-wrapper';
const db = getFirestore();
```

### 2. GitHub Actions Workflows
Tous les workflows utilisent maintenant le service account PROD :

**Avant :**
```yaml
- name: Setup environment variables
  run: |
    echo "${{ secrets.ENV_FILE }}" > .env
```

**Après :**
```yaml
- name: Setup service account
  run: |
    echo '${{ secrets.FIREBASE_SERVICE_ACCOUNT_PROD }}' > service-account-prod.json

# ... étapes de mise à jour ...

- name: Cleanup service account
  if: always()
  run: |
    rm -f service-account-prod.json
```

## Configuration requise

### Secret GitHub nécessaire

Vous devez avoir configuré le secret `FIREBASE_SERVICE_ACCOUNT_PROD` sur GitHub :

1. Allez sur https://github.com/votre-username/vb-rank/settings/secrets/actions
2. Le secret `FIREBASE_SERVICE_ACCOUNT_PROD` doit contenir le JSON complet du service account

**Vérification :** Le secret devrait déjà être configuré (créé lors de la configuration de la migration).

## Utilisation en local

Pour tester les scripts en local, vous avez 2 options :

### Option 1 : Fichier JSON (Recommandé)

1. Copiez votre service account PROD à la racine du projet :
   ```bash
   cp ~/Downloads/le-cres-vb-firebase-adminsdk-*.json service-account-prod.json
   ```

2. Lancez le script :
   ```bash
   npm run update:classement-n3
   ```

3. Supprimez le fichier après :
   ```bash
   rm service-account-prod.json
   ```

### Option 2 : Variable d'environnement

**Windows PowerShell :**
```powershell
$env:FIREBASE_SERVICE_ACCOUNT_PROD = Get-Content "C:\path\to\le-cres-vb-service-account.json" -Raw
npm run update:classement-n3
```

**Linux/Mac :**
```bash
export FIREBASE_SERVICE_ACCOUNT_PROD=$(cat /path/to/le-cres-vb-service-account.json)
npm run update:classement-n3
```

## Fonctionnement

1. **Firestore Wrapper** ([scripts/config/firestore-wrapper.ts](scripts/config/firestore-wrapper.ts))
   - Charge automatiquement le service account depuis ENV ou fichier
   - Initialise Firebase Admin SDK
   - Retourne l'instance Firestore

2. **GitHub Actions**
   - Crée le fichier `service-account-prod.json` depuis le secret
   - Lance le script de mise à jour
   - Nettoie le fichier (même en cas d'erreur)

3. **Firebase Admin SDK**
   - Contourne les règles de sécurité Firestore
   - Permet les écritures en production
   - Utilise les credentials du service account

## Règles Firestore

Les règles actuelles en production sont :

```javascript
allow read: if true;   // Lecture publique
allow write: if false; // Écriture bloquée
```

Avec Firebase Admin SDK, les règles sont contournées car le service account a des privilèges administrateur.

## Sécurité

✅ **Bonnes pratiques respectées :**
- Service account jamais commité dans Git (`.gitignore`)
- Fichier automatiquement supprimé après utilisation
- Secret GitHub chiffré
- Logs GitHub ne montrent jamais le contenu du service account

⚠️ **Important :**
- Ne jamais commiter `service-account-prod.json`
- Ne jamais partager le contenu du service account
- Supprimer le fichier immédiatement après usage en local

## Dépannage

### Erreur "Service account non trouvé"
- Vérifiez que `FIREBASE_SERVICE_ACCOUNT_PROD` est défini (GitHub)
- OU que `service-account-prod.json` existe (local)

### Erreur de permissions Firestore
- Vérifiez que le service account a bien les droits sur le projet Firebase
- Le service account doit être généré depuis la console Firebase du projet PROD

### Script fonctionne en local mais pas sur GitHub
- Vérifiez que le secret `FIREBASE_SERVICE_ACCOUNT_PROD` est bien configuré sur GitHub
- Le JSON doit être complet (pas de caractères manquants)

## Scripts utilitaires

- `scripts/utils/migrate-to-admin-sdk.js` - Migration automatique des scripts
- `scripts/utils/add-cleanup-to-workflows.js` - Ajout du cleanup dans les workflows
- `scripts/utils/update-workflows-for-admin-sdk.js` - Mise à jour des workflows

Ces scripts ont déjà été exécutés et ne sont plus nécessaires sauf pour référence.
