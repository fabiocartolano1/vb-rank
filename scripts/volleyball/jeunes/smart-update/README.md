# Smart Update - Championnats Jeunes

Scripts de mise à jour automatique des classements et matchs pour tous les championnats jeunes.

## 📋 Scripts disponibles

### Scripts individuels
- `smart-update-bfc.ts` - Benjamines Féminin
- `smart-update-bmb.ts` - Benjamins Masculin
- `smart-update-cfd.ts` - Cadettes Féminin
- `smart-update-mfd.ts` - Minimes Féminin
- `smart-update-mmb.ts` - Minimes Masculin
- `smart-update-m18m.ts` - Moins 18 Masculin

### Script orchestrateur
- `run-all-smart-updates.ts` - Lance tous les scripts en séquence

## 🚀 Utilisation

### Exécuter un championnat individuel
```bash
cd scripts/volleyball/jeunes/smart-update
npx tsx smart-update-cfd.ts
```

### Exécuter tous les championnats
```bash
cd scripts/volleyball/jeunes/smart-update
npx tsx run-all-smart-updates.ts
```

## ⚙️ Configuration GitHub Actions / Cron

### Option 1 : Scripts individuels séparés (Approche actuelle)

**Avantages :**
- ✅ Isolation complète - un échec n'affecte pas les autres
- ✅ Logs séparés par championnat dans GitHub Actions
- ✅ Possibilité de lancer manuellement un seul championnat
- ✅ Plus simple à déboguer

**Inconvénients :**
- ❌ Pas de cache npm partagé entre les exécutions
- ❌ Overhead de démarrage répété (parsing, compilation)
- ❌ Connexions Firebase multiples
- ❌ Plus de workflows à gérer

**Configuration :** Workflows individuels `.github/workflows/smart-update-*.yml`

### Option 2 : Script orchestrateur (Recommandé)

**Avantages :**
- ✅ Cache npm partagé pour toutes les exécutions
- ✅ Un seul workflow à gérer
- ✅ Résumé global des mises à jour
- ✅ Économie de temps d'exécution (~30-40%)
- ✅ Pause configurable entre les scripts pour ne pas surcharger Firebase

**Inconvénients :**
- ❌ Un échec critique peut bloquer les suivants (mitigé par l'isolation des processus)
- ❌ Logs groupés dans un seul fichier (mais séparés visuellement)

**Configuration :** Workflow unique `.github/workflows/smart-update-all-jeunes.yml`

## 📊 Comparaison des performances

| Approche | Temps total | Connexions Firebase | Cache npm |
|----------|-------------|---------------------|-----------|
| Scripts séparés | ~45-60s | 6 (une par script) | ❌ Non partagé |
| Orchestrateur | ~30-40s | 6 (séquentielles) | ✅ Partagé |

## 🔧 Configuration recommandée

Pour la plupart des cas d'usage, **l'orchestrateur est recommandé** :

```yaml
# .github/workflows/smart-update-all-jeunes.yml
on:
  schedule:
    - cron: '0 7,13,19 * * *' # 8h, 14h, 20h (France)
  workflow_dispatch:

jobs:
  update-all:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm' # ✅ Cache activé
      - run: npm ci
      - run: npx tsx scripts/volleyball/jeunes/smart-update/run-all-smart-updates.ts
```

## 📝 Logs

Tous les scripts génèrent des logs dans le dossier `logs/` avec un timestamp :
- Format : `YYYY-MM-DDTHH-mm-ss_nom-script.log`
- Rétention : 30 jours (configurable)

## 🔍 Fonctionnalités

- ✅ Détection de changements par hash (évite les mises à jour inutiles)
- ✅ Normalisation des noms d'équipes (accents, espaces, casse)
- ✅ Correspondance automatique avec Firestore
- ✅ Logs détaillés avec correspondances d'équipes
- ✅ Statistiques de mise à jour
- ✅ Gestion d'erreurs robuste

## 🐛 Debug

En cas d'équipes non trouvées, le script affiche :
```
⚠️  Castries Vb - Équipe non trouvée dans la base de données
   📝 Normalisé: "CASTRIES VB"
   💡 Équipes disponibles dans la DB:
      - "Castries" → normalisé: "CASTRIES"
```

Cela permet de rapidement identifier les différences de nommage.
