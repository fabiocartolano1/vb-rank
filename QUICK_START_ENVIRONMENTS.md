# 🚀 Quick Start - Environnements Firebase

## ⚡ TL;DR - Ce que tu dois faire MAINTENANT

### 1️⃣ Créer un projet Firebase de PRODUCTION

- Va sur https://console.firebase.google.com/
- Crée un nouveau projet (ex: `vb-rank-prod`)
- Active Firestore Database en mode production

### 2️⃣ Récupérer les clés Firebase

Dans ton nouveau projet de production :
1. Paramètres du projet ⚙️
2. Section "Vos applications"
3. Clique sur le code `</>` pour voir la config
4. **Copie toutes les valeurs**

### 3️⃣ Éditer environment.production.ts

Ouvre `src/environments/environment.production.ts` et remplace :

```typescript
export const environment = {
  production: true,
  firebase: {
    apiKey: 'TA_VRAIE_CLE',              // 👈 Colle ici
    authDomain: 'TON_AUTH_DOMAIN',       // 👈 Colle ici
    projectId: 'TON_PROJECT_ID',         // 👈 Colle ici
    storageBucket: 'TON_STORAGE',        // 👈 Colle ici
    messagingSenderId: 'TON_SENDER_ID',  // 👈 Colle ici
    appId: 'TON_APP_ID',                 // 👈 Colle ici
    measurementId: 'TON_MEASUREMENT_ID', // 👈 Colle ici
  },
};
```

### 4️⃣ Tester

```bash
# Test dev (devrait déjà fonctionner)
npm start

# Test build prod
npm run build
```

## ✅ C'est tout !

Tu as maintenant deux environnements séparés :

- **DEV** : Base actuelle (`vb-rank`) → Utilisée avec `npm start`
- **PROD** : Nouvelle base → Utilisée avec `npm run build`

## 📖 Plus d'infos ?

- **SETUP_CHECKLIST.md** : Guide complet étape par étape
- **ENVIRONMENTS.md** : Documentation détaillée
- **src/environments/README.md** : Infos techniques

---

**Temps nécessaire** : 10-15 minutes ⏱️
