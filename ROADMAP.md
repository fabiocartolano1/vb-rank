# Roadmap - SportRank

Ce document contient les idées et améliorations futures pour l'application SportRank.

## Table des matières
- [Architecture Multi-tenant](#architecture-multi-tenant)
- [Optimisation du Scraping](#optimisation-du-scraping)
- [Hébergement et Domaine](#hébergement-et-domaine)

---

## Architecture Multi-tenant

### Contexte
Actuellement, l'application est déployée pour un seul club (Le Crès VB). Pour vendre l'application à plusieurs clubs, deux architectures sont possibles :

### Option 1 : Multi-tenant (RECOMMANDÉ) ⭐

**Principe :** Un seul compte Firebase héberge tous les clubs.

```
Firebase Project "SportRank Production"
├── Club A (lecresvb)
├── Club B (handball-toulouse)
├── Club C (basket-paris)
└── Club D (rugby-bordeaux)
```

**Avantages :**
- ✅ Gestion centralisée (1 seul déploiement pour tous)
- ✅ Coûts réduits (économies d'échelle)
- ✅ Maintenance facile (1 codebase, 1 update)
- ✅ Analytics globales
- ✅ Facturation centralisée

**Inconvénients :**
- ⚠️ Nécessite d'adapter le code pour gérer le `clubId` partout
- ⚠️ Risque de "fuite" de données entre clubs si mal implémenté
- ⚠️ Tous les clubs impactés si panne

**Coûts estimés :**
- 5-10 clubs : ~10-20€/mois
- 50 clubs : ~50-100€/mois

### Option 2 : Multi-instance

**Principe :** Un compte Firebase par club.

**Avantages :**
- ✅ Isolation totale (sécurité maximale)
- ✅ Panne isolée par club

**Inconvénients :**
- ❌ Déploiement manuel pour chaque club
- ❌ Maintenance complexe
- ❌ Coûts multipliés

**Coûts estimés :**
- Par club : ~5-15€/mois
- 10 clubs : ~50-150€/mois

### Plan de migration (Multi-tenant)

#### Phase 1 : Préparer le multi-tenant
1. Ajouter `clubId` partout dans le code
2. Créer `clubs/lecresvb/` dans Firestore et migrer les données
3. Tester avec lecresvb uniquement

**Modifications nécessaires :**

**Structure Firestore :**
```
// Avant
matchs/
  └── {matchId}

// Après
clubs/
  └── {clubId}/
      └── matchs/
          └── {matchId}
```

**Scripts de scraping :**
```typescript
// scripts/update/update-matchs-n3.ts
async function updateMatchs(clubId: string) {
  const db = getFirestore();
  const matchsRef = collection(db, 'clubs', clubId, 'matchs');
  // ... rest of code
}
```

**Configuration par club :**
```typescript
// src/config/clubs.ts
export const CLUBS_CONFIG = {
  'lecresvb': {
    name: 'Le Crès Volley-Ball',
    sport: 'volleyball',
    leagues: ['N3', 'R2M'],
    domain: 'lecresvb.sportrank.fr'
  },
  'toulouse-hb': {
    name: 'Toulouse Handball',
    sport: 'handball',
    leagues: ['N2', 'R1'],
    domain: 'toulouse-hb.sportrank.fr'
  }
};
```

**Firebase Hosting multi-site :**
```json
// firebase.json
{
  "hosting": [
    {
      "target": "lecresvb",
      "public": "dist/vb-rank-app/browser",
      "rewrites": [{"source": "**", "destination": "/index.html"}]
    },
    {
      "target": "toulouse-hb",
      "public": "dist/vb-rank-app/browser",
      "rewrites": [{"source": "**", "destination": "/index.html"}]
    }
  ]
}
```

**Security Rules Firestore :**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /clubs/{clubId}/matchs/{matchId} {
      // Users can only read their club's data
      allow read: if request.auth != null &&
                     request.auth.token.clubId == clubId;
      allow write: if request.auth != null &&
                      request.auth.token.admin == true &&
                      request.auth.token.clubId == clubId;
    }
  }
}
```

#### Phase 2 : Ajouter un 2e club test
1. Créer `clubs/club-test/`
2. Adapter les workflows GitHub Actions pour accepter un paramètre `clubId`
3. Tester l'isolation des données

#### Phase 3 : Automatiser
1. Script d'onboarding de nouveaux clubs
2. Interface admin pour gérer les clubs
3. Facturation automatique

---

## Optimisation du Scraping

### Problème actuel
Les scripts de scraping s'exécutent toutes les heures (ou toutes les 30 min le weekend), même si aucun changement n'a eu lieu sur les sites des fédérations. Cela consomme des ressources inutilement.

### Solution recommandée : Hybrid Approach 🏆

Combiner plusieurs approches pour être toujours à jour sans gaspiller de ressources :

1. **Hash-based detection** pour éviter les updates inutiles
2. **Adaptive polling** selon jour/heure
3. **Cache côté client** pour réduire les lectures Firestore

### Implémentation en 3 étapes

#### Étape 1 : Hash-based detection (Quick Win - 2h de dev)

**Principe :** Calculer un hash MD5 du HTML de la page de championnat. Si le hash n'a pas changé, skip l'update complète.

**Économie immédiate : 80% des runs inutiles**

```typescript
// scripts/update/smart-update.ts
import { createHash } from 'crypto';

interface ScrapingState {
  lastHash: string;
  lastUpdate: number;
  consecutiveNoChange: number;
}

async function smartUpdate() {
  // 1. Fetch la page HTML
  const html = await fetchChampionnatPage();

  // 2. Calculer un hash du contenu
  const currentHash = createHash('md5').update(html).digest('hex');

  // 3. Comparer avec le dernier hash stocké
  const state = await getStateFromFirestore();

  if (currentHash === state.lastHash) {
    console.log('Aucun changement détecté, skip l\'update');

    // Réduire la fréquence si pas de changements
    await updatePollingInterval(state.consecutiveNoChange + 1);
    return;
  }

  // 4. Si changement détecté, faire le scraping complet
  console.log('Changements détectés, mise à jour complète');
  await fullScrapingUpdate();

  // 5. Réinitialiser l'intervalle
  await resetPollingInterval();
}

// Ajuster dynamiquement la fréquence
function getNextCheckDelay(consecutiveNoChange: number): number {
  if (consecutiveNoChange === 0) return 5 * 60 * 1000;  // 5 min
  if (consecutiveNoChange < 3) return 10 * 60 * 1000;   // 10 min
  if (consecutiveNoChange < 6) return 20 * 60 * 1000;   // 20 min
  return 60 * 60 * 1000;                                 // 1 heure
}
```

**Stockage du state dans Firestore :**
```typescript
// Collection: _system/scraping-state
{
  "n3-matchs": {
    lastHash: "a3f5e9c...",
    lastUpdate: 1234567890,
    consecutiveNoChange: 3
  },
  "r2m-classement": {
    lastHash: "b7d2a1...",
    lastUpdate: 1234567890,
    consecutiveNoChange: 0
  }
}
```

#### Étape 2 : Adaptive scheduling (1h de dev)

**Principe :** Adapter la fréquence de scraping selon le jour et l'heure.

**Économie supplémentaire : 10%**

```typescript
// scripts/update/hybrid-update.ts
interface UpdateStrategy {
  checkInterval: number;
  updateIfChanged: boolean;
}

function getStrategy(): UpdateStrategy {
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();

  // Samedi 18h-00h : checks fréquents
  if (day === 6 && hour >= 18) {
    return { checkInterval: 5, updateIfChanged: true };
  }

  // Dimanche 12h-22h : checks fréquents
  if (day === 0 && hour >= 12 && hour <= 22) {
    return { checkInterval: 10, updateIfChanged: true };
  }

  // Lundi soir 19h-21h : résultats finaux
  if (day === 1 && hour >= 19 && hour <= 21) {
    return { checkInterval: 15, updateIfChanged: true };
  }

  // Reste de la semaine : check léger
  return { checkInterval: 120, updateIfChanged: false };
}

async function hybridUpdate() {
  const strategy = getStrategy();

  // Toujours faire un check léger (hash)
  const html = await fetchPage();
  const hash = createHash('md5').update(html).digest('hex');

  const lastHash = await getLastHash();

  if (hash !== lastHash) {
    console.log('🔄 Changement détecté !');

    // Update complet seulement si stratégie le permet
    if (strategy.updateIfChanged) {
      await fullUpdate();
      await saveHash(hash);
    }
  } else {
    console.log('✓ Pas de changements');
  }
}
```

**Workflow GitHub Actions optimisé :**
```yaml
# .github/workflows/smart-update-matchs.yml
name: Smart Update Matchs

on:
  schedule:
    # Samedi : toutes les 5 minutes de 18h à minuit
    - cron: '*/5 17-23 * * 6'

    # Dimanche : toutes les 10 minutes de 12h à 22h
    - cron: '*/10 11-21 * * 0'

    # Lundi : toutes les 15 minutes de 19h à 21h
    - cron: '*/15 19-21 * * 1'

    # Reste de la semaine : 1x par jour à 8h
    - cron: '0 8 * * 2-5'

  workflow_dispatch:

jobs:
  smart-update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run smart update
        run: npm run update:smart-matchs
        env:
          FIREBASE_CONFIG: ${{ secrets.FIREBASE_CONFIG }}
```

#### Étape 3 : Cache côté client (3h de dev)

**Principe :** Cache les données dans Angular pour réduire les lectures Firestore.

**Économie supplémentaire : 50% sur les reads Firestore**

```typescript
// src/app/services/cache.service.ts
@Injectable({ providedIn: 'root' })
export class CacheService {
  private cache = new Map<string, { data: any; timestamp: number }>();

  async get<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = 5 * 60 * 1000
  ): Promise<T> {
    const cached = this.cache.get(key);

    if (cached && Date.now() - cached.timestamp < ttl) {
      console.log(`Cache hit for ${key}`);
      return cached.data;
    }

    console.log(`Cache miss for ${key}, fetching...`);
    const data = await fetcher();
    this.cache.set(key, { data, timestamp: Date.now() });

    return data;
  }

  invalidate(key: string) {
    this.cache.delete(key);
  }
}

// Utilisation dans un service
async function getClassement() {
  return cacheService.get('classement-n3', async () => {
    const snapshot = await db.collection('classements').doc('n3').get();
    return snapshot.data();
  }, 5 * 60 * 1000); // Cache 5 minutes
}
```

### Comparaison des coûts

| Approche | Checks/jour | Updates/jour | Coût Firebase | Latence |
|----------|-------------|--------------|---------------|---------|
| Actuel (1h) | 24 | 24 | 100% | 30 min avg |
| Smart Polling | 24 | 5-10 | 20-40% | 30 min avg |
| Adaptive | 50-100 | 5-10 | 10-20% | 5-10 min |
| Hybrid ⭐ | 100-150 | 5-10 | 15% | 5-10 min |

### Autres solutions explorées

#### Solution 1 : Webhooks
**Concept :** Les sites de fédérations envoient une notification quand un résultat change.

**Problème :** La FFVB et autres fédérations n'offrent pas de webhooks publics. Non viable.

#### Solution 2 : Firebase Functions avec scheduling intelligent
**Principe :** Utiliser Firebase Cloud Functions pour gérer le scheduling dynamiquement.

```typescript
// functions/src/smart-scheduler.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const smartScheduler = functions.pubsub
  .schedule('every 5 minutes')
  .onRun(async (context) => {
    const db = admin.firestore();

    // Récupérer l'état actuel
    const stateRef = db.collection('_system').doc('scraping-state');
    const state = await stateRef.get();

    const now = Date.now();
    const lastUpdate = state.data()?.lastUpdate || 0;
    const minutesSinceUpdate = (now - lastUpdate) / 1000 / 60;

    // Stratégie par jour de la semaine
    const isMatchDay = isWeekend() || isMonday();

    if (isMatchDay) {
      // Weekend = matchs en cours, check toutes les 5 min
      await triggerScrapingIfNeeded(5);
    } else {
      // En semaine = peu de changements, check toutes les heures
      await triggerScrapingIfNeeded(60);
    }
  });

function isWeekend(): boolean {
  const day = new Date().getDay();
  return day === 0 || day === 6; // Dimanche ou Samedi
}

function isMonday(): boolean {
  return new Date().getDay() === 1;
}
```

**Avantages :**
- Serverless, scalable
- Coût très faible en semaine

**Note :** Peut être combiné avec l'approche Hybrid.

---

## Hébergement et Domaine

### Coûts actuels
- **Firebase Hosting (Spark Plan)** : 0€ (gratuit)
- **Firestore/Functions** : Dans les limites gratuites
- **Total** : 0€/mois

### Pour ajouter un nom de domaine .com

#### Coûts estimés
- **Nom de domaine .com** : ~12€/an (1€/mois)
  - OVH : ~12€/an
  - Gandi : ~15€/an
  - Google Domains/Cloudflare : ~12€/an
  - Namecheap : ~10€/an

- **Firebase Hosting** : 0€ (reste gratuit avec domaine custom)

**Total avec domaine : ~12€/an (1€/mois)**

#### Configuration

1. Acheter le domaine chez un registrar (OVH, Gandi, Cloudflare, etc.)
2. Dans Firebase Console → Hosting → "Add custom domain"
3. Ajouter les DNS records fournis par Firebase
4. Firebase fournit automatiquement un certificat SSL gratuit

**Firebase Hosting inclut :**
- CDN global gratuit
- Certificat SSL automatique
- HTTP/2 et HTTP/3
- Rollback facile des déploiements

### Pour plusieurs clubs (multi-tenant)

**Option A : Sous-domaines**
- `lecresvb.sportrank.fr`
- `toulouse-hb.sportrank.fr`
- `paris-basket.sportrank.fr`

**Option B : Domaines dédiés par club**
- `lecresvb.fr` (actuel)
- `toulouse-handball.fr`
- `paris-basket.fr`

**Coût :**
- Option A : 1 domaine = ~12€/an
- Option B : N domaines = ~12€ × N /an

---

## Priorisation

### Quick Wins (à faire en priorité)
1. ✅ Landing page commerciale (fait)
2. 🔲 Hash-based scraping detection (2h, 80% économie)
3. 🔲 Acheter un domaine .com (15 min, 12€/an)

### Moyen terme
4. 🔲 Adaptive scheduling (1h, 10% économie supplémentaire)
5. 🔲 Cache côté client (3h, 50% économie sur reads)

### Long terme
6. 🔲 Architecture multi-tenant (2-3 semaines)
7. 🔲 Interface admin pour gérer les clubs
8. 🔲 Facturation automatique (Stripe integration)
