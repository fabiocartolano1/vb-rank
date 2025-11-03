# 📜 Scripts de Gestion de la Base de Données

Ce dossier contient tous les scripts utilitaires pour gérer les données Firebase : migration, scraping, et initialisation.

## 🔄 Scripts de Migration DEV → PROD

### Migration complète
```bash
npm run migrate:dev-to-prod
```

**Fichier:** `migrate-dev-to-prod.ts`

Copie **toutes** les données de la base de développement vers la production.
- Écrase les documents existants
- Utilise des batches optimisés (500 docs à la fois)
- Affiche des statistiques détaillées

**Utiliser pour:** Initialisation de la base PROD, réinitialisation complète, premier déploiement

### Synchronisation incrémentale
```bash
npm run sync:dev-to-prod
```

**Fichier:** `sync-dev-to-prod.ts`

Synchronise intelligemment les données entre DEV et PROD.
- Mode incrémental : Ajoute nouveaux + Met à jour modifiés
- Mode écrasement : Force mise à jour de tous les documents
- Compare les documents avant d'écrire

**Utiliser pour:** Mises à jour régulières, ajout de nouveaux matchs, synchronisation partielle

📖 **Documentation complète:** [MIGRATION_GUIDE.md](../MIGRATION_GUIDE.md)

---

## 🗄️ Scripts de Scraping et Import

## Scripts disponibles

### init-championnats.ts

Initialise les 5 championnats dans Firebase avec leurs données de base.

**Utilisation:**

```bash
npx tsx scripts/init-championnats.ts
```

### link-equipes-ids.ts

Lie les noms d'équipes aux IDs de la collection `equipes` dans les matchs et le classement.

**Utilisation:**

```bash
npx tsx scripts/link-equipes-ids.ts
```

**Ce que fait le script:**
- Récupère toutes les équipes de la collection `equipes`
- Pour chaque match, ajoute `equipeDomicileId` et `equipeExterieurId` basés sur les noms
- Pour chaque entrée de classement, ajoute `equipeId` basé sur le nom
- Affiche un résumé des mises à jour effectuées

**Ce que fait le script init-championnats.ts:**
- Crée 5 championnats dans la collection `championnats`
- Chaque championnat a un ID, un nom, une URL (vide à remplir) et une équipe associée

**Championnats créés:**
1. **regionale-2-m** - Régionale 2 M
2. **regionale-2-f** - Régionale 2 F
3. **prenationale-m** - Pré-nationale M
4. **prenationale-f** - Pré-nationale F
5. **nationale-3-f** - Nationale 3 F

**Après exécution:**
1. Aller dans Firebase Console
2. Ouvrir la collection `championnats`
3. Renseigner les URLs de scraping pour chaque championnat

## Structure des données

### Championnat
```typescript
{
  id: string;           // ID unique (slug du nom)
  nom: string;          // Nom du championnat
  url: string;          // URL de scraping (à renseigner)
  equipe: string;       // Équipe associée
}
```

### Match (mis à jour)
Les matchs ont maintenant un champ `championnatId` qui référence le championnat correspondant.

```typescript
{
  id?: string;
  championnatId?: string;  // ID du championnat (ex: "regionale-2-m")
  journee: number;
  date: string;
  // ... autres champs
}
```
