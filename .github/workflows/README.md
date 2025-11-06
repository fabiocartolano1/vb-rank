# GitHub Actions - Configuration

## Scripts automatisés

### update-classement-n3.yml
Mise à jour automatique du classement Nationale 3 tous les soirs à 21h (heure de Paris).

## Configuration des secrets

Pour que les workflows fonctionnent, vous devez configurer les secrets GitHub suivants :

### 1. FIREBASE_CONFIG

Contenu du fichier `scripts/config/firebase-config.ts` :

```typescript
export const firebaseConfig = {
  apiKey: "votre-api-key",
  authDomain: "votre-project.firebaseapp.com",
  projectId: "votre-project-id",
  storageBucket: "votre-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "votre-app-id"
};
```

### 2. ENV_FILE

Contenu du fichier `.env` :

```env
# Vos variables d'environnement si nécessaire
```

## Ajouter les secrets

1. Allez dans votre repository GitHub
2. Cliquez sur **Settings** > **Secrets and variables** > **Actions**
3. Cliquez sur **New repository secret**
4. Ajoutez chaque secret :
   - Nom : `FIREBASE_CONFIG`
   - Valeur : Le contenu du fichier de config Firebase
   - Nom : `ENV_FILE`
   - Valeur : Le contenu du fichier .env

## Lancer manuellement

Vous pouvez lancer n'importe quel workflow manuellement :

1. Allez dans **Actions**
2. Sélectionnez le workflow (ex: "Update Classement N3")
3. Cliquez sur **Run workflow**
4. Sélectionnez la branche et cliquez sur **Run workflow**

## Consulter les logs

Après chaque exécution :

1. Allez dans **Actions**
2. Cliquez sur l'exécution du workflow
3. Dans la section **Artifacts**, téléchargez les logs
4. Les logs sont au format : `classement-n3-logs-{run-id}.zip`

Les logs sont conservés pendant 30 jours.

## Modifier l'heure d'exécution

Pour changer l'heure d'exécution, modifiez la ligne `cron` dans le fichier `.github/workflows/update-classement-n3.yml` :

```yaml
schedule:
  - cron: '0 20 * * *'  # Format: minute heure jour_du_mois mois jour_de_la_semaine
```

**Important** : GitHub Actions utilise l'heure UTC. Pour Paris :
- Hiver (UTC+1) : 21h Paris = 20h UTC
- Été (UTC+2) : 21h Paris = 19h UTC

Exemples :
- `'0 20 * * *'` = Tous les jours à 20h UTC (21h Paris en hiver)
- `'30 19 * * *'` = Tous les jours à 19h30 UTC (20h30 Paris en hiver)
- `'0 8 * * 1'` = Tous les lundis à 8h UTC
- `'0 */6 * * *'` = Toutes les 6 heures
