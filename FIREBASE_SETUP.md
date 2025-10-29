# Configuration Firebase

## Prochaines étapes

1. **Créer un projet Firebase**
   - Allez sur https://console.firebase.google.com/
   - Créez un nouveau projet
   - Activez Firestore Database
   - Activez Authentication (si nécessaire)

2. **Obtenir les clés de configuration**
   - Dans les paramètres du projet Firebase
   - Section "Vos applications" > Ajouter une application web
   - Copiez les informations de configuration

3. **Mettre à jour le fichier environment.ts**
   - Ouvrez `src/environments/environment.ts`
   - Remplacez les valeurs par celles de votre projet Firebase

4. **Lancer l'application**
   ```bash
   npm start
   ```
   L'application sera disponible sur http://localhost:4200

## Structure du projet

- `src/app/app.config.ts` - Configuration Angular avec Firebase
- `src/environments/environment.ts` - Variables d'environnement et config Firebase
