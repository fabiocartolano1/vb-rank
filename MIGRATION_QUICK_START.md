# ⚡ Migration Rapide - DEV vers PROD

## 🎯 TL;DR

Tu as maintenant **2 scripts** pour copier tes données de DEV vers PROD.

### Option 1 : Migration Complète (Première fois)
```bash
npm run migrate:dev-to-prod
```
✅ Copie TOUT de DEV vers PROD
⚠️ Écrase les données existantes

### Option 2 : Synchronisation (Mises à jour)
```bash
npm run sync:dev-to-prod
```
✅ Ajoute les nouveaux documents
✅ Met à jour les documents modifiés
⏭️ Ignore les documents identiques

## 📋 Checklist Rapide

Avant de lancer la migration :

1. ✅ Tu as configuré `environment.production.ts` avec tes vraies clés
2. ✅ Tu as créé un projet Firebase de production
3. ✅ Tu as créé une base Firestore en production
4. ✅ (Optionnel) Tu as configuré des règles permissives temporaires

## 🚀 Première Migration

### Étape 1 : Règles Firestore temporaires

Dans la console Firebase de **PROD**, ouvre **Firestore > Règles** et mets :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;  // ⚠️ Temporaire !
    }
  }
}
```

Publie les règles.

### Étape 2 : Lancer la migration

```bash
npm run migrate:dev-to-prod
```

Le script va :
1. Te montrer les stats actuelles (DEV et PROD)
2. Te demander confirmation
3. Migrer toutes les données
4. Afficher un résumé

### Étape 3 : Restaurer les règles strictes

Après la migration, retourne dans **Firestore > Règles** et mets :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read: if true;
      allow write: if false;  // Lecture seule en prod
    }
  }
}
```

## 📊 Exemple de Sortie

```
╔════════════════════════════════════════════════════════════╗
║  🚀 Migration des données DEV vers PROD                   ║
╚════════════════════════════════════════════════════════════╝

📡 Connexion aux bases de données...
   DEV:  vb-rank
   PROD: le-cres-vb

📊 Statistiques des bases de données:

┌─────────────────┬──────────────┬──────────────┐
│ Collection      │ DEV (source) │ PROD (cible) │
├─────────────────┼──────────────┼──────────────┤
│ championnats    │            1 │            0 │
│ equipes         │           12 │            0 │
│ matchs          │          132 │            0 │
└─────────────────┴──────────────┴──────────────┘

⚠️  ATTENTION: Cette opération va COPIER toutes les données de DEV vers PROD.

Voulez-vous continuer ? (oui/non): oui

🔄 Migration de la collection "championnats"...
   📦 1 documents à migrer
   ✅ 1/1 documents migrés avec succès

🔄 Migration de la collection "equipes"...
   📦 12 documents à migrer
   ✅ 12/12 documents migrés avec succès

🔄 Migration de la collection "matchs"...
   📦 132 documents à migrer
   ✅ 132/132 documents migrés avec succès

╔════════════════════════════════════════════════════════════╗
║  📊 Résumé de la migration                                 ║
╚════════════════════════════════════════════════════════════╝

✅ championnats    : 1/1 migrés
✅ equipes         : 12/12 migrés
✅ matchs          : 132/132 migrés

📦 Total: 145 documents migrés

✅ Migration terminée!
```

## ⚠️ En cas de problème

### "Permission denied"
→ Vérifie les règles Firestore de PROD (mettre temporairement `allow write: if true`)

### "Cannot find module environment.production"
→ Vérifie que `src/environments/environment.production.ts` existe et contient tes clés

### Le script plante
→ Redémarre le terminal et relance le script

## 📖 Documentation complète

Pour tous les détails, consulte [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)

---

**Temps estimé** : 2-5 minutes ⏱️
