# Configuration du projet VB Rank

## Installation

1. Installer les dépendances :
```bash
npm install
```

2. Configurer Firebase :
   - Copier `src/environments/environment.example.ts` vers `src/environments/environment.ts`
   - Remplir avec vos vraies clés Firebase depuis la console Firebase

3. Lancer l'application :
```bash
npm start
```

4. L'application sera accessible sur http://localhost:4200

## Première utilisation

1. Ouvrir l'application dans le navigateur
2. Vérifier que la connexion Firebase est établie
3. Cliquer sur "Importer les données FFVB" pour remplir la base de données
4. Naviguer entre les pages Classement et Matchs

## Structure du projet

- `src/app/models/` - Modèles de données (Équipe, Match, Classement)
- `src/app/services/` - Services (DataService, DataImportService)
- `src/app/pages/` - Composants des pages (Classement, Matchs)
- `src/environments/` - Configuration Firebase (NON commitée sur Git)

## Sécurité

⚠️ **IMPORTANT** : Ne jamais commiter le fichier `src/environments/environment.ts` qui contient les clés Firebase.
