# 🌍 Guide des Environnements - VB Rank

> **Documentation complète pour gérer les environnements DEV et PROD**

---

## 📚 Documentation disponible

| Fichier | Description | Quand l'utiliser |
|---------|-------------|------------------|
| **[WORKFLOW_DEV_PROD.md](WORKFLOW_DEV_PROD.md)** | Guide complet du workflow | **⭐ COMMENCE ICI** |
| [ENVIRONMENTS.md](ENVIRONMENTS.md) | Configuration des environnements | Setup initial |
| [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) | Migration des données | Copier DEV → PROD |
| [MIGRATION_QUICK_START.md](MIGRATION_QUICK_START.md) | Migration rapide | Première migration |
| [QUICK_START_ENVIRONMENTS.md](QUICK_START_ENVIRONMENTS.md) | Config rapide | Setup rapide |
| [SETUP_CHECKLIST.md](SETUP_CHECKLIST.md) | Checklist complète | Vérification étape par étape |

---

## ⚡ Quick Start

### Développement
```bash
npm start
```

### Déploiement en production
```bash
npm run deploy:prod
```

### Migration des données DEV → PROD
```bash
# 1. Ouvrir permissions Firestore PROD temporairement
# 2. Lancer la migration
npm run migrate:dev-to-prod

# 3. Restaurer permissions strictes
```

---

## 🎯 Commandes essentielles

### Développement
```bash
npm start                    # Démarre le serveur dev (utilise DEV)
npm test                     # Lance les tests
npm run build                # Build production
```

### Migration de données
```bash
npm run migrate:dev-to-prod  # Migration complète DEV → PROD
npm run sync:dev-to-prod     # Synchronisation incrémentale
```

### Déploiement
```bash
npm run deploy:prod          # Build + Deploy PROD
npm run deploy:dev           # Build + Deploy DEV
npm run check:firebase       # Vérifier le projet Firebase actif
npm run use:dev              # Basculer sur projet DEV
npm run use:prod             # Basculer sur projet PROD
```

---

## 🏗️ Architecture

### Projets Firebase

```
┌─────────────┐                  ┌─────────────┐
│     DEV     │                  │    PROD     │
│   vb-rank   │  ══Migration══>  │ le-cres-vb  │
└─────────────┘                  └─────────────┘
     │                                  │
     │ npm start                        │ npm run deploy:prod
     │                                  │
     ▼                                  ▼
localhost:4200              le-cres-vb.web.app
```

### Fichiers d'environnement

```
src/environments/
├── environment.development.ts    → Utilisé par npm start
└── environment.production.ts     → Utilisé par npm run build
```

---

## 🔐 Règles Firestore

### DEV (vb-rank)
```javascript
// Tout permis pour les tests
allow read, write: if true;
```

### PROD (le-cres-vb)
```javascript
// Lecture publique, écriture interdite
allow read: if true;
allow write: if false;
```

**⚠️ Exception** : Mettre `write: true` TEMPORAIREMENT pendant les migrations, puis restaurer `write: false`.

---

## 📊 Workflow typique

```
1. DÉVELOPPER
   └─> npm start
   └─> Coder et tester en local
   └─> Ajouter données de test en DEV

2. MIGRER
   └─> Ouvrir permissions PROD
   └─> npm run sync:dev-to-prod
   └─> Restaurer permissions strictes

3. DÉPLOYER
   └─> npm run deploy:prod
   └─> Vérifier le site en ligne
```

---

## 🆘 Aide rapide

### Problème : "Missing or insufficient permissions"
**Solution** : Vérifier les règles Firestore (ajouter `allow read: if true`)

### Problème : Les données ne s'affichent pas en PROD
**Solution** :
1. Vérifier la migration : `npm run migrate:dev-to-prod`
2. Vérifier les règles Firestore PROD
3. Vider le cache du navigateur

### Problème : Le déploiement va vers le mauvais projet
**Solution** :
```bash
npm run check:firebase    # Vérifier le projet actif
npm run use:prod          # Basculer vers PROD
```

---

## 📖 Pour aller plus loin

**Lis en priorité** : [WORKFLOW_DEV_PROD.md](WORKFLOW_DEV_PROD.md)

Ce fichier contient :
- Configuration détaillée
- Workflow quotidien
- Procédures de migration
- Résolution de problèmes
- Bonnes pratiques

---

## ✅ Checklist avant déploiement PROD

- [ ] Tests passent localement
- [ ] Données migrées en PROD
- [ ] Règles Firestore PROD strictes (`write: false`)
- [ ] Build production réussi
- [ ] Projet Firebase = `le-cres-vb`
- [ ] Site vérifié en ligne après déploiement

---

**Dernière mise à jour** : Novembre 2025
**Mainteneur** : VB Rank Team
