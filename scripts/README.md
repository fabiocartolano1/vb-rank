# 📜 Scripts de Gestion de la Base de Données

Ce dossier contient tous les scripts utilitaires pour gérer les données Firebase : migration, scraping, et initialisation.

## 🔐 Configuration Sécurisée

### Variables d'environnement

Les scripts utilisent des variables d'environnement pour se connecter à Firebase. **Ne jamais commiter les credentials Firebase dans le code !**

1. **Copier le fichier template** :
   ```bash
   cp .env.example .env
   ```

2. **Remplir les valeurs** dans le fichier `.env` avec vos credentials Firebase :
   ```env
   FIREBASE_API_KEY=votre_api_key
   FIREBASE_AUTH_DOMAIN=votre_project.firebaseapp.com
   FIREBASE_PROJECT_ID=votre_project_id
   FIREBASE_STORAGE_BUCKET=votre_project.firebasestorage.app
   FIREBASE_MESSAGING_SENDER_ID=votre_sender_id
   FIREBASE_APP_ID=votre_app_id
   FIREBASE_MEASUREMENT_ID=votre_measurement_id
   ```

3. **Le fichier `.env` est dans le `.gitignore`** et ne sera jamais commité sur GitHub.

⚠️ **IMPORTANT** : Tous les scripts utilisent maintenant `config/firebase-config.ts` qui charge automatiquement les variables d'environnement depuis `.env`. Ne jamais mettre de credentials en dur dans le code !

## 🔄 Scripts de Migration

### Migration DEV → PROD
```bash
npm run migrate:dev-to-prod
```

**Fichier:** `migrate-dev-to-prod.ts`

Copie **toutes** les données de la base de développement vers la production.
- Écrase les documents existants
- Utilise des batches optimisés (500 docs à la fois)
- Affiche des statistiques détaillées

**Utiliser pour:** Initialisation de la base PROD, réinitialisation complète, premier déploiement

### Migration PROD → DEV (Inverse)
```bash
npm run migrate:prod-to-dev
```

**Fichier:** `migrate-prod-to-dev.ts`

Copie **toutes** les données de la base de production vers le développement.
- ⚠️ ATTENTION: Supprime toutes les données DEV existantes
- Utilise des batches optimisés (500 docs à la fois)
- Affiche des statistiques détaillées
- Demande confirmation avant d'agir

**Utiliser pour:** Restaurer DEV depuis PROD quand PROD est plus stable, réinitialiser DEV

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

## 🔄 Scripts de Mise à Jour des Données

Ces scripts mettent à jour les données existantes dans Firebase sans créer de doublons. Ils comparent les données scrapées avec celles en base et ne mettent à jour que ce qui a changé.

### Mise à jour des classements

Met à jour les statistiques des équipes : rang, points, matchs joués, victoires, défaites, sets pour/contre.

#### Championnats Adultes

```bash
npm run update:classement-n3    # Nationale 3 Féminine
npm run update:classement-pnf   # Pré-Nationale Féminine
npm run update:classement-pnm   # Pré-Nationale Masculine
npm run update:classement-r2f   # Régionale 2 Féminine
```

#### Championnats Jeunes

```bash
npm run update:classement-m18m  # M18 Masculin
npm run update:classement-bfc   # Benjamines Filles Comité
npm run update:classement-bmb   # Benjamins Mixtes Brassage
npm run update:classement-cfd   # Cadettes Filles Départemental
npm run update:classement-mfd   # Minimes Filles Départemental
npm run update:classement-mmb   # Minimes Mixtes Brassage
```

**Ce que font ces scripts :**
- Scrapent le classement depuis le site FFV
- Comparent avec les données existantes dans Firebase
- Mettent à jour uniquement les équipes qui ont changé
- Affichent un résumé détaillé (mis à jour / inchangés / non trouvés)

### Mise à jour des matchs

Met à jour les informations des matchs : dates, heures, scores, détails des sets, statut (à venir / terminé).

#### Championnats Adultes

```bash
npm run update:matchs-n3        # Nationale 3 Féminine
npm run update:matchs-pnf       # Pré-Nationale Féminine
npm run update:matchs-pnm       # Pré-Nationale Masculine
npm run update:matchs-r2f       # Régionale 2 Féminine
```

#### Championnats Jeunes

```bash
npm run update:matchs-m18m      # M18 Masculin
npm run update:matchs-bfc       # Benjamines Filles Comité
npm run update:matchs-bmb       # Benjamins Mixtes Brassage
npm run update:matchs-cfd       # Cadettes Filles Départemental
npm run update:matchs-mfd       # Minimes Filles Départemental
npm run update:matchs-mmb       # Minimes Mixtes Brassage
```

**Ce que font ces scripts :**
- Scrapent tous les matchs depuis le site FFV
- Récupèrent les IDs des équipes depuis Firebase
- Comparent avec les matchs existants
- Mettent à jour les matchs qui ont changé (nouveaux scores, changement de statut)
- Affichent un résumé détaillé

**💡 Utilisation recommandée :** Exécuter ces scripts régulièrement (quotidien ou hebdomadaire) pour maintenir les données à jour automatiquement.

---

## 🗄️ Scripts de Scraping et Import

## Scripts disponibles

### init-championnats.ts

Initialise les 5 championnats seniors dans Firebase avec leurs données de base.

**Utilisation:**

```bash
npx tsx scripts/init-championnats.ts
```

### add-jeunes-championnats.ts

Ajoute les 6 championnats jeunes dans Firebase.

**Utilisation:**

```bash
npm run add:jeunes
```

**Championnats ajoutés:**
- M18M
- BFC
- BMB
- MFD
- MMB
- CFD

### Scripts de scraping jeunes

Scrape les classements et matchs des championnats jeunes :

```bash
npm run scrape:m18m    # M18 Masculin
npm run scrape:bfc     # Benjamines Filles Comité
npm run scrape:bmb     # Benjamins Mixtes Brassage
npm run scrape:mfd     # Minimes Filles Départemental
npm run scrape:mmb     # Minimes Mixtes Brassage
npm run scrape:cfd     # Cadettes Filles Départemental
```

**Fonctionnement:**
- Récupère l'URL depuis Firebase
- Scrape le classement et crée les équipes
- Scrape les matchs et les lie aux équipes
- Supprime les matchs existants avant de les recréer

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
