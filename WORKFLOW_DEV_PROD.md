# 🔄 Workflow DEV/PROD - Guide Complet

Ce guide couvre **TOUTES** les bonnes pratiques pour travailler avec les environnements DEV et PROD.

---

## 📋 Table des matières

1. [Configuration initiale](#-1-configuration-initiale)
2. [Développement quotidien](#-2-développement-quotidien)
3. [Migration des données](#-3-migration-des-données)
4. [Déploiement en production](#-4-déploiement-en-production)
5. [Règles de sécurité Firestore](#-5-règles-de-sécurité-firestore)
6. [Commandes utiles](#-6-commandes-utiles)
7. [Résolution de problèmes](#-7-résolution-de-problèmes)

---

## 🎯 1. Configuration initiale

### 1.1 Projets Firebase

Tu dois avoir **2 projets Firebase** distincts :

| Environnement | Projet Firebase | Usage |
|---------------|-----------------|-------|
| **DEV** | `vb-rank` | Développement et tests |
| **PROD** | `le-cres-vb` | Application en ligne |

### 1.2 Fichiers d'environnement Angular

```
src/environments/
├── environment.ts               # Fichier de base (ignoré par Git)
├── environment.development.ts   # Configuration DEV (ignoré par Git)
├── environment.production.ts    # Configuration PROD (ignoré par Git)
└── environment.example.ts       # Template de référence
```

**⚠️ IMPORTANT** : Les fichiers `environment.*.ts` ne sont JAMAIS commités dans Git (protégés par `.gitignore`).

### 1.3 Configuration Firebase CLI

Créer des alias pour faciliter le basculement entre projets :

```bash
# Ajouter l'alias "dev"
firebase use --add
# Sélectionner vb-rank, taper "dev" comme alias

# Ajouter l'alias "prod"
firebase use --add
# Sélectionner le-cres-vb, taper "prod" comme alias
```

Vérifier la configuration :

```bash
firebase projects:list
```

---

## 💻 2. Développement quotidien

### 2.1 Lancer l'application en DEV

```bash
npm start
```

**Ce qui se passe :**
- Angular utilise automatiquement `environment.development.ts`
- L'app se connecte à la base Firebase **vb-rank** (DEV)
- Le serveur démarre sur `http://localhost:4200`

### 2.2 Vérifier l'environnement actif

Ajoute temporairement dans ton code pour vérifier :

```typescript
import { environment } from './environments/environment';

console.log('🔧 Environment:', environment.production ? 'PRODUCTION' : 'DEVELOPMENT');
console.log('🔥 Firebase Project:', environment.firebase.projectId);
```

### 2.3 Modifier des données en DEV

Tu peux modifier librement les données dans la console Firebase du projet **vb-rank** :
- https://console.firebase.google.com/project/vb-rank/firestore

---

## 📦 3. Migration des données

### 3.1 Workflow de migration

```
┌─────────────┐
│   DEV       │  Développement et tests
│  vb-rank    │
└──────┬──────┘
       │
       │ Migration (quand prêt)
       ▼
┌─────────────┐
│   PROD      │  Application en ligne
│ le-cres-vb  │
└─────────────┘
```

### 3.2 Première migration (base PROD vide)

**Étape 1** : Ouvrir temporairement les permissions PROD

1. Console Firebase → Projet **le-cres-vb** → Firestore Database → Règles
2. Remplacer par :
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if true;  // ⚠️ TEMPORAIRE
       }
     }
   }
   ```
3. Publier

**Étape 2** : Lancer la migration

```bash
npm run migrate:dev-to-prod
```

**Étape 3** : Restaurer les permissions strictes (CRUCIAL !)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /championnats/{championnatId} {
      allow read: if true;
      allow write: if false;
    }
    match /equipes/{equipeId} {
      allow read: if true;
      allow write: if false;
    }
    match /matchs/{matchId} {
      allow read: if true;
      allow write: if false;
    }
  }
}
```

### 3.3 Synchronisation incrémentale (mises à jour)

Pour ajouter de nouveaux matchs ou mettre à jour des équipes :

**Étape 1** : Ouvrir temporairement les permissions (comme ci-dessus)

**Étape 2** : Synchroniser

```bash
npm run sync:dev-to-prod
```

Choisir le mode :
- **Incrémental** : Ajoute nouveaux + met à jour modifiés (recommandé)
- **Écrasement** : Force la mise à jour de tout

**Étape 3** : Restaurer les permissions strictes

### 3.4 Quand faire une migration ?

| Situation | Script à utiliser |
|-----------|-------------------|
| Première mise en prod | `npm run migrate:dev-to-prod` |
| Ajout de nouveaux matchs | `npm run sync:dev-to-prod` |
| Modification d'équipes | `npm run sync:dev-to-prod` |
| Réinitialisation complète | `npm run migrate:dev-to-prod` |

---

## 🚀 4. Déploiement en production

### 4.1 Workflow complet de déploiement

```bash
# 1. Vérifier qu'on est sur la bonne branche
git status

# 2. Build en mode production
npm run build

# 3. Vérifier le projet Firebase actif
firebase projects:list

# 4. Basculer sur PROD si nécessaire
firebase use prod
# ou
firebase use le-cres-vb

# 5. Déployer
firebase deploy --only hosting

# 6. Vérifier le déploiement
firebase open hosting:site
```

### 4.2 Ce que fait le build production

Quand tu lances `npm run build` :
- Angular utilise `environment.production.ts`
- L'app compilée utilisera la base **le-cres-vb**
- Code optimisé et minifié
- Output dans `dist/vb-rank-app/`

### 4.3 Vérifier avant de déployer

**Checklist pré-déploiement :**

- [ ] Les tests passent (`npm test`)
- [ ] L'app fonctionne en local (`npm start`)
- [ ] Les données sont migrées en PROD
- [ ] Les règles Firestore PROD sont strictes
- [ ] Le projet Firebase actif est **le-cres-vb**

### 4.4 Scripts npm recommandés

Ajoute ces scripts dans `package.json` pour simplifier :

```json
{
  "scripts": {
    "deploy:dev": "ng build --configuration development && firebase use dev && firebase deploy",
    "deploy:prod": "ng build --configuration production && firebase use prod && firebase deploy",
    "check:firebase": "firebase projects:list"
  }
}
```

Usage :
```bash
npm run deploy:prod
```

---

## 🔒 5. Règles de sécurité Firestore

### 5.1 Règles de DÉVELOPPEMENT (permissives)

**Projet :** vb-rank

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;  // Tout permis pour tester
    }
  }
}
```

### 5.2 Règles de PRODUCTION (strictes)

**Projet :** le-cres-vb

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Lecture publique, écriture interdite
    match /championnats/{championnatId} {
      allow read: if true;
      allow write: if false;
    }

    match /equipes/{equipeId} {
      allow read: if true;
      allow write: if false;
    }

    match /matchs/{matchId} {
      allow read: if true;
      allow write: if false;
    }
  }
}
```

### 5.3 Règles temporaires (migration)

**⚠️ Utiliser UNIQUEMENT pendant les migrations, puis restaurer les règles strictes immédiatement.**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;  // ⚠️ TEMPORAIRE
    }
  }
}
```

### 5.4 Bonnes pratiques de sécurité

✅ **À FAIRE :**
- Toujours restaurer les règles strictes après migration
- Vérifier les règles dans la console Firebase régulièrement
- Limiter l'écriture en PROD (`allow write: if false`)
- Autoriser la lecture publique pour un site de classements

❌ **À NE PAS FAIRE :**
- Laisser `allow write: if true` en PROD en permanence
- Utiliser les mêmes règles en DEV et PROD
- Oublier de publier les règles après modification

---

## 🛠️ 6. Commandes utiles

### 6.1 Angular

```bash
# Développement (DEV)
npm start                                    # Démarre le serveur dev
ng serve --configuration development         # Explicite

# Build (PROD)
npm run build                                # Build production
ng build --configuration production          # Explicite

# Build (DEV)
ng build --configuration development         # Build dev

# Tests
npm test                                     # Lance les tests
```

### 6.2 Firebase CLI

```bash
# Gestion des projets
firebase projects:list                       # Liste tous les projets
firebase use dev                             # Bascule sur DEV
firebase use prod                            # Bascule sur PROD
firebase use le-cres-vb                      # Bascule par nom

# Déploiement
firebase deploy                              # Déploie tout
firebase deploy --only hosting               # Déploie uniquement l'hosting
firebase deploy --only firestore:rules       # Déploie uniquement les règles

# Informations
firebase open hosting:site                   # Ouvre le site déployé
firebase hosting:channel:list                # Liste les canaux de preview
```

### 6.3 Migration de données

```bash
# Migration complète
npm run migrate:dev-to-prod                  # Copie tout de DEV → PROD

# Synchronisation
npm run sync:dev-to-prod                     # Sync incrémentale DEV → PROD
```

### 6.4 Vérification de l'environnement

```bash
# Vérifier quel projet Firebase est actif
firebase projects:list

# Vérifier la configuration Angular
cat src/environments/environment.development.ts
cat src/environments/environment.production.ts

# Vérifier les règles Firestore
firebase firestore:rules get
```

---

## 🔧 7. Résolution de problèmes

### 7.1 "Missing or insufficient permissions"

**Cause :** Règles Firestore trop strictes

**Solution :**
1. Ouvrir la console Firebase du bon projet
2. Firestore Database → Règles
3. Ajouter `allow read: if true` pour la collection concernée
4. Publier

### 7.2 "Firebase App named '[DEFAULT]' already exists"

**Cause :** Fichier d'environnement mal configuré

**Solution :**
```bash
# Vérifier que les clés sont différentes
cat src/environments/environment.development.ts
cat src/environments/environment.production.ts
```

Les `projectId` doivent être différents.

### 7.3 "Cannot find module './environments/environment.production'"

**Cause :** Fichier d'environnement manquant

**Solution :**
```bash
# Créer depuis l'exemple
cp src/environments/environment.example.ts src/environments/environment.production.ts

# Éditer avec tes vraies clés
nano src/environments/environment.production.ts
```

### 7.4 L'app ne charge pas les données en PROD

**Causes possibles :**

1. **Règles Firestore trop strictes**
   - Solution : Vérifier `allow read: if true`

2. **Mauvais projet Firebase**
   - Solution : Vérifier `environment.production.ts`

3. **Données non migrées**
   - Solution : Lancer `npm run migrate:dev-to-prod`

4. **Cache du navigateur**
   - Solution : Vider le cache ou ouvrir en navigation privée

### 7.5 Le déploiement pointe vers le mauvais projet

**Cause :** Mauvais projet Firebase actif

**Solution :**
```bash
# Vérifier le projet actif
firebase projects:list

# Basculer vers le bon projet
firebase use le-cres-vb
```

### 7.6 Les modifications ne sont pas déployées

**Solution :**
```bash
# 1. Rebuild complètement
rm -rf dist/
npm run build

# 2. Vérifier le projet actif
firebase use prod

# 3. Redéployer
firebase deploy --only hosting

# 4. Vider le cache du navigateur
# Cmd+Shift+R (Mac) ou Ctrl+Shift+R (Windows)
```

---

## 📊 8. Récapitulatif visuel

### 8.1 Environnements

```
┌─────────────────────────────────────────────────────────┐
│                    DÉVELOPPEMENT                        │
├─────────────────────────────────────────────────────────┤
│ Commande      : npm start                               │
│ Environnement : environment.development.ts              │
│ Projet FB     : vb-rank                                 │
│ URL           : http://localhost:4200                   │
│ Règles        : Permissives (write: true)               │
│ Usage         : Tests, développement                    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                     PRODUCTION                          │
├─────────────────────────────────────────────────────────┤
│ Commande      : npm run build                           │
│ Environnement : environment.production.ts               │
│ Projet FB     : le-cres-vb                              │
│ URL           : https://le-cres-vb.web.app              │
│ Règles        : Strictes (write: false)                 │
│ Usage         : Site public                             │
└─────────────────────────────────────────────────────────┘
```

### 8.2 Workflow typique

```
1. DÉVELOPPEMENT
   │
   ├─> npm start
   ├─> Coder des fonctionnalités
   ├─> Tester localement
   ├─> Ajouter des données de test en DEV
   │
2. MIGRATION
   │
   ├─> Ouvrir permissions PROD temporairement
   ├─> npm run sync:dev-to-prod
   ├─> Restaurer permissions strictes
   │
3. DÉPLOIEMENT
   │
   ├─> npm run build
   ├─> firebase use prod
   ├─> firebase deploy
   ├─> Vérifier le site en ligne
   │
4. VÉRIFICATION
   │
   └─> Tester le site en production
```

---

## 📚 9. Ressources

- **Documentation Firebase** : https://firebase.google.com/docs
- **Documentation Angular** : https://angular.dev
- **Guide de migration** : [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)
- **Configuration environnements** : [ENVIRONMENTS.md](ENVIRONMENTS.md)

---

## ✅ Checklist finale

Avant chaque déploiement en PROD :

- [ ] Code testé en local (`npm start`)
- [ ] Données migrées (`npm run sync:dev-to-prod`)
- [ ] Règles Firestore PROD vérifiées (strictes)
- [ ] Build production réussi (`npm run build`)
- [ ] Projet Firebase correct (`firebase use prod`)
- [ ] Déploiement effectué (`firebase deploy`)
- [ ] Site vérifié en ligne
- [ ] Cache navigateur vidé pour tester

---

**Dernière mise à jour :** Novembre 2025
**Version :** 1.0
