# 📦 Guide de Migration des Données - DEV vers PROD

Ce guide explique comment copier les données de votre base de données de développement vers votre base de données de production.

## 🎯 Deux modes de migration disponibles

### 1️⃣ Migration complète (Écrasement total)

**Script:** `migrate-dev-to-prod.ts`
**Commande:** `npm run migrate:dev-to-prod`

- ✅ Copie **TOUS** les documents de DEV vers PROD
- ⚠️ **ÉCRASE** les documents existants en PROD (même ID)
- 🎯 Utiliser pour : Initialisation de la base PROD, réinitialisation complète

### 2️⃣ Synchronisation incrémentale (Mode intelligent)

**Script:** `sync-dev-to-prod.ts`
**Commande:** `npm run sync:dev-to-prod`

- ✅ Ajoute les **nouveaux** documents
- ✅ Met à jour les documents **modifiés**
- ⏭️ Ignore les documents **identiques**
- 🎯 Utiliser pour : Mises à jour régulières, synchronisation partielle

## 🚀 Utilisation

### Première migration (Base PROD vide)

```bash
# 1. Assurez-vous d'avoir configuré environment.production.ts
# 2. Lancez la migration complète
npm run migrate:dev-to-prod
```

Le script vous demandera confirmation avant de procéder.

### Synchronisation régulière

```bash
# Pour synchroniser les nouvelles données
npm run sync:dev-to-prod
```

Vous pourrez choisir entre :
- **Mode incrémental** : Synchronise uniquement les changements (recommandé)
- **Mode écrasement** : Force la mise à jour de tous les documents

## 📊 Collections migrées

Les scripts migrent automatiquement ces 3 collections :

1. **championnats** : Configuration des championnats
2. **equipes** : Équipes et classements
3. **matchs** : Historique complet des matchs

## 🔒 Sécurité et bonnes pratiques

### Avant de migrer

1. ✅ **Vérifiez** que `environment.production.ts` contient les bonnes clés
2. ✅ **Testez** votre application en mode dev (`npm start`)
3. ✅ **Sauvegardez** les données PROD existantes si nécessaire
4. ✅ **Vérifiez** les règles de sécurité Firestore de PROD

### Sauvegarde manuelle (optionnel)

Vous pouvez exporter votre base PROD avant migration :

```bash
# Via Firebase CLI
firebase firestore:export gs://your-bucket-name/backups/$(date +%Y%m%d)
```

### Règles de sécurité

⚠️ **Important** : Assurez-vous que les règles Firestore de PROD permettent l'écriture.

**Pendant la migration**, vous pouvez temporairement utiliser :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;  // ⚠️ TEMPORAIRE UNIQUEMENT
    }
  }
}
```

**Après la migration**, restaurez les règles strictes :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /equipes/{equipeId} {
      allow read: if true;
      allow write: if false;  // Lecture seule
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

## 📝 Exemple d'utilisation

### Scénario 1 : Première mise en production

```bash
# 1. Configuration de l'environnement de production
# Éditer src/environments/environment.production.ts

# 2. Migration complète
npm run migrate:dev-to-prod

# Résultat :
# ✅ 12 équipes migrées
# ✅ 132 matchs migrés
# ✅ 1 championnat migré
```

### Scénario 2 : Ajout de nouveaux matchs

Vous avez ajouté 10 nouveaux matchs en DEV et vous voulez les synchroniser en PROD :

```bash
npm run sync:dev-to-prod

# Choisir : Mode incrémental

# Résultat :
# ✅ 10 nouveaux matchs ajoutés
# ⏭️ 122 matchs existants ignorés
```

### Scénario 3 : Mise à jour d'une équipe

Une équipe a changé de logo en DEV :

```bash
npm run sync:dev-to-prod

# Résultat :
# ✅ 1 équipe mise à jour
# ⏭️ 11 équipes inchangées
```

## 🔍 Comprendre la sortie du script

Le script affiche des informations détaillées :

```
📊 Statistiques des bases de données:

┌─────────────────┬──────────────┬──────────────┐
│ Collection      │ DEV (source) │ PROD (cible) │
├─────────────────┼──────────────┼──────────────┤
│ championnats    │            1 │            0 │
│ equipes         │           12 │            0 │
│ matchs          │          132 │            0 │
└─────────────────┴──────────────┴──────────────┘
```

Pendant la migration :

```
🔄 Migration de la collection "matchs"...
   📦 132 documents à migrer
   ✅ 132/132 documents migrés avec succès
```

Résumé final :

```
📊 Résumé de la migration

✅ championnats    : 1/1 migrés
✅ equipes         : 12/12 migrés
✅ matchs          : 132/132 migrés

📦 Total: 145 documents migrés
```

## ⚠️ Résolution de problèmes

### Erreur : "Permission denied"

**Cause** : Les règles Firestore de PROD bloquent l'écriture.

**Solution** :
1. Ouvrez la console Firebase de votre projet PROD
2. Allez dans Firestore > Règles
3. Ajoutez temporairement `allow write: if true;`
4. Lancez la migration
5. Restaurez les règles strictes après

### Erreur : "Cannot find module './environments/environment.production'"

**Cause** : Le fichier d'environnement de production n'existe pas ou est mal configuré.

**Solution** :
```bash
# Vérifier que le fichier existe
ls src/environments/environment.production.ts

# S'il manque, le créer depuis l'exemple
cp src/environments/environment.example.ts src/environments/environment.production.ts
# Puis éditer avec vos vraies clés
```

### Erreur : "Firebase App named 'dev' already exists"

**Cause** : Le script a été interrompu et relancé.

**Solution** : Redémarrer complètement le terminal et relancer le script.

### Avertissement : "X documents échoués"

**Cause** : Certains documents ont des données invalides.

**Solution** :
1. Vérifier les logs pour identifier les documents problématiques
2. Corriger manuellement dans la console Firebase
3. Relancer la synchronisation

## 🛠️ Personnalisation des scripts

Si vous avez des collections supplémentaires à migrer, éditez le fichier du script :

```typescript
// Dans scripts/migrate-dev-to-prod.ts ou scripts/sync-dev-to-prod.ts
const COLLECTIONS = ['championnats', 'equipes', 'matchs', 'votre-collection'];
```

## 📚 Ressources

- [Documentation Firestore](https://firebase.google.com/docs/firestore)
- [Règles de sécurité Firestore](https://firebase.google.com/docs/firestore/security/get-started)
- [Export/Import Firestore](https://firebase.google.com/docs/firestore/manage-data/export-import)

## 🆘 Support

En cas de problème :

1. Vérifiez les logs du script (affichés dans le terminal)
2. Consultez la console Firebase pour vérifier l'état des bases
3. Vérifiez que les deux fichiers d'environnement sont correctement configurés

---

**⏱️ Temps de migration estimé** : 1-5 minutes selon la taille des données

**💡 Conseil** : Effectuez la première migration en dehors des heures de production pour éviter tout impact sur les utilisateurs.
