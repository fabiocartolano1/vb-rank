# Scripts de scraping et initialisation

Ce dossier contient les scripts pour gérer le scraping des données et l'initialisation de la base de données.

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
