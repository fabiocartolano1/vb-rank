# 🏐 Smart Updates - Guide complet

Ce guide explique comment utiliser les scripts de mise à jour automatique pour tous les championnats.

## 📋 Vue d'ensemble

Le projet contient **3 niveaux d'orchestration** pour les mises à jour :

```
scripts/
├── run-all-smart-updates.ts          # 🌍 GLOBAL : Tous championnats (jeunes + adultes)
├── volleyball/
│   ├── jeunes/
│   │   └── smart-update/
│   │       ├── run-all-smart-updates.ts  # 👶 Tous les jeunes
│   │       ├── smart-update-bfc.ts       # 📄 Scripts individuels
│   │       ├── smart-update-bmb.ts
│   │       ├── smart-update-cfd.ts
│   │       ├── smart-update-mfd.ts
│   │       ├── smart-update-mmb.ts
│   │       └── smart-update-m18m.ts
│   └── adultes/
│       └── smart-update/
│           ├── run-all-smart-updates.ts  # 👨 Tous les adultes
│           ├── smart-update-n3.ts        # 📄 Scripts individuels
│           ├── smart-update-pnf.ts
│           ├── smart-update-pnm.ts
│           ├── smart-update-r2f.ts
│           └── smart-update-r2m.ts
```

## 🚀 Utilisation rapide

### Via npm scripts (recommandé)

```bash
# Tous les championnats (11 scripts)
npm run smart:update:all

# Seulement les jeunes (6 scripts)
npm run smart:update:jeunes

# Seulement les adultes (5 scripts)
npm run smart:update:adultes

# Un championnat spécifique
npm run smart:update:cfd
npm run smart:update:n3
```

### Via commandes directes

```bash
# Tous
npx tsx scripts/run-all-smart-updates.ts

# Jeunes
npx tsx scripts/volleyball/jeunes/smart-update/run-all-smart-updates.ts

# Adultes
npx tsx scripts/volleyball/adultes/smart-update/run-all-smart-updates.ts

# Individuel
npx tsx scripts/volleyball/jeunes/smart-update/smart-update-cfd.ts
```

## 📊 Comparaison des approches

### Option 1 : Orchestrateur global (Recommandé ✅)

**Commande :** `npm run smart:update:all`

**Avantages :**
- ✅ **Cache npm partagé** pour tous les 11 scripts
- ✅ **Économie de temps** : ~60-90s au lieu de 120-180s
- ✅ **Un seul workflow** GitHub Actions à gérer
- ✅ **Résumé global** avec statistiques
- ✅ **Logs centralisés**
- ✅ **Durée moyenne par script** affichée
- ✅ **Pourcentages de réussite**

**Inconvénients :**
- ❌ Tous les logs dans un seul fichier (mais bien séparés visuellement)
- ❌ Si l'orchestrateur plante, tous les suivants sont bloqués (rare)

**Sortie exemple :**
```
🚀 MISE À JOUR SMART - TOUS LES CHAMPIONNATS (JEUNES + ADULTES)
======================================================================

👶 CHAMPIONNATS JEUNES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✅ Benjamines Féminin (BFC)           5.2s
  ✅ Benjamins Masculin (BMB)           6.1s
  ✅ Cadettes Féminin (CFD)             4.8s
  ...

👨 CHAMPIONNATS ADULTES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✅ Nationale 3 (N3)                   7.3s
  ✅ Pré-Nationale Féminin (PNF)        5.9s
  ...

📊 RÉSUMÉ GLOBAL
======================================================================
✅ Réussis: 11/11 (100.0%)
❌ Échecs: 0/11 (0.0%)
⏱️  Durée totale: 68.45s
⏱️  Durée moyenne: 6.22s par championnat
```

### Option 2 : Orchestrateurs séparés

**Commandes :**
- `npm run smart:update:jeunes` (6 scripts)
- `npm run smart:update:adultes` (5 scripts)

**Avantages :**
- ✅ Cache npm partagé **par catégorie**
- ✅ Séparation jeunes/adultes
- ✅ Résumé par catégorie
- ✅ Plus facile à déboguer une catégorie

**Inconvénients :**
- ❌ Pas de vue d'ensemble globale
- ❌ Deux workflows GitHub Actions à gérer
- ❌ Pas de cache partagé entre jeunes et adultes

### Option 3 : Scripts individuels

**Commandes :** `npm run smart:update:cfd`, etc.

**Avantages :**
- ✅ **Isolation complète**
- ✅ Debug très facile
- ✅ Logs dédiés

**Inconvénients :**
- ❌ **Pas de cache npm partagé**
- ❌ Overhead de démarrage répété
- ❌ 11 workflows GitHub Actions à gérer
- ❌ Pas de résumé global

## ⚙️ Configuration GitHub Actions

### Workflow recommandé : Global

Fichier : [`.github/workflows/smart-update-all.yml`](../.github/workflows/smart-update-all.yml)

```yaml
on:
  schedule:
    - cron: '0 7,13,19 * * *' # 8h, 14h, 20h (France)
  workflow_dispatch:

jobs:
  update-all-championnats:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          cache: 'npm' # ✅ Cache activé !
      - run: npm ci
      - run: npx tsx scripts/run-all-smart-updates.ts
```

**Durée estimée :** ~1-2 minutes (selon les changements)

### Workflows alternatifs

- **Jeunes uniquement** : [`.github/workflows/smart-update-all-jeunes.yml`](../.github/workflows/smart-update-all-jeunes.yml)
- **Adultes uniquement** : [`.github/workflows/smart-update-adultes.yml`](../.github/workflows/smart-update-adultes.yml)

## 🔧 Fonctionnalités avancées

### Pause entre scripts

Par défaut, il y a une **pause de 2 secondes** entre chaque script pour éviter de surcharger Firebase.

Modifier dans les orchestrateurs :
```typescript
await new Promise(resolve => setTimeout(resolve, 2000)); // 2s
```

### Timeout

Les workflows ont un timeout de 30 minutes max. Ajustable dans les `.yml` :
```yaml
timeout-minutes: 30
```

### Logs en cas d'échec

Les logs sont automatiquement uploadés dans GitHub Actions si un script échoue :
```yaml
- name: 📊 Upload logs
  if: failure()
  uses: actions/upload-artifact@v4
```

## 📈 Performances

### Temps d'exécution (estimation)

| Configuration | Scripts | Temps | Cache npm |
|---------------|---------|-------|-----------|
| **11 individuels** | 11 | ~120-180s | ❌ Non |
| **Orchestrateur global** | 11 | ~60-90s | ✅ Oui |
| **Jeunes seuls** | 6 | ~35-50s | ✅ Oui |
| **Adultes seuls** | 5 | ~30-40s | ✅ Oui |

**Économie avec orchestrateur : 40-50%** 🚀

### Économie de ressources GitHub Actions

- **Scripts individuels** : 11 workflows × 2-3 min = **22-33 min/exécution**
- **Orchestrateur** : 1 workflow × 1-2 min = **1-2 min/exécution**

**Économie : ~90% de temps de CI** 💰

## 🐛 Troubleshooting

### Équipe non trouvée

Si vous voyez :
```
⚠️  Castries Vb - Équipe non trouvée dans la base de données
   📝 Normalisé: "CASTRIES VB"
   💡 Équipes disponibles dans la DB:
      - "Castries" → normalisé: "CASTRIES"
```

**Solution :** Le nom dans Firestore ne correspond pas. Mettez à jour Firestore ou ajustez la normalisation dans `utils/text-utils.ts`.

### Script bloqué

Si un script ne se termine pas :
1. Vérifier les logs dans `scripts/volleyball/.../smart-update/logs/`
2. Augmenter le timeout dans le workflow
3. Lancer le script individuellement pour déboguer

### Erreur de cache npm

Si le cache npm cause des problèmes :
```bash
# Nettoyer le cache
npm cache clean --force

# Réinstaller
rm -rf node_modules package-lock.json
npm install
```

## 📝 Structure des logs

Les logs sont organisés par date et script :
```
scripts/volleyball/jeunes/smart-update/logs/
├── 2025-11-24T09-00-00_smart-update-cfd.log
├── 2025-11-24T09-00-00_run-all-smart-updates.log
└── ...
```

Rétention : 30 jours (configurable)

## 🎯 Recommandation finale

Pour la **production**, utilisez :
```bash
npm run smart:update:all
```

Pour le **debug d'un championnat spécifique** :
```bash
npm run smart:update:cfd
```

Pour le **développement/test** :
```bash
# Tester jeunes uniquement
npm run smart:update:jeunes

# Tester adultes uniquement
npm run smart:update:adultes
```
