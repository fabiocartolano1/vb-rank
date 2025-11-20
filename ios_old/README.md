# VB Rank iOS App

Application iOS native en SwiftUI pour le suivi des classements et matchs de volley-ball du club du Crès.

## Architecture

L'application est développée en **SwiftUI** avec une architecture **MVVM** (Model-View-ViewModel) et utilise **Firebase Firestore** pour la synchronisation des données en temps réel.

### Structure du projet

```
VBRank/
├── Models/                    # Modèles de données
│   ├── Team.swift            # Modèle Équipe
│   ├── Match.swift           # Modèle Match
│   └── Championship.swift    # Modèle Championnat
├── ViewModels/               # ViewModels (logique métier)
│   ├── RankingsViewModel.swift
│   ├── MatchesViewModel.swift
│   └── AgendaViewModel.swift
├── Views/                    # Vues SwiftUI
│   ├── RankingsView.swift    # Vue de classement
│   ├── MatchesView.swift     # Vue des matchs
│   ├── AgendaView.swift      # Vue agenda
│   ├── ContentView.swift     # Navigation TabBar
│   └── Components/           # Composants réutilisables
│       ├── ChampionshipPicker.swift
│       ├── TeamLogoView.swift
│       └── MatchCardView.swift
├── Services/                 # Services
│   └── FirestoreService.swift  # Service de connexion Firestore
└── Utilities/                # Utilitaires
    ├── DateFormatter+Extensions.swift
    └── Constants.swift
```

## Fonctionnalités

1. **Classement** : Affiche le classement des équipes par championnat
   - Tri par rang
   - Médailles pour les 3 premiers
   - Mise en évidence de l'équipe du Crès
   - Sélection du championnat

2. **Matchs** : Liste tous les matchs organisés par journée
   - Groupement par journée
   - Expansion/réduction des journées
   - Auto-scroll vers la prochaine journée
   - Mise en évidence des matchs du Crès

3. **Agenda** : Vue weekend par weekend des matchs à domicile du Crès
   - Navigation entre les weekends
   - Affichage samedi/dimanche
   - Indicateurs victoire/défaite
   - Détails des sets

## Prérequis

- **Xcode 15+** (avec Swift 5.9+)
- **iOS 16.0+**
- **CocoaPods** ou **Swift Package Manager**
- Compte Firebase avec accès au projet `vb-rank`

## Installation

### 1. Cloner le repository

```bash
cd ios/VBRank
```

### 2. Installer les dépendances Firebase

#### Option A : Swift Package Manager (recommandé)

1. Ouvrir le projet dans Xcode
2. Aller dans **File > Add Packages...**
3. Ajouter le SDK Firebase :
   - URL : `https://github.com/firebase/firebase-ios-sdk`
   - Version : 10.0.0 ou plus récent
4. Sélectionner les packages suivants :
   - `FirebaseFirestore`
   - `FirebaseFirestoreSwift`

#### Option B : CocoaPods

Créer un `Podfile` :

```ruby
platform :ios, '16.0'
use_frameworks!

target 'VBRank' do
  pod 'Firebase/Firestore'
end
```

Puis installer :

```bash
pod install
```

### 3. Configurer Firebase

Le fichier `GoogleService-Info.plist` est déjà présent et configuré avec les credentials du projet Firebase `vb-rank`.

**IMPORTANT** : Assurez-vous que ce fichier est bien ajouté au target dans Xcode.

### 4. Ouvrir le projet

```bash
# Si vous utilisez CocoaPods
open VBRank.xcworkspace

# Si vous utilisez SPM
open VBRank.xcodeproj
```

## Configuration du projet Xcode

### 1. Créer un nouveau projet

1. **File > New > Project**
2. Choisir **iOS > App**
3. Paramètres :
   - Product Name : `VBRank`
   - Team : Votre équipe de développement
   - Organization Identifier : `com.vbrank`
   - Bundle Identifier : `com.vbrank.app`
   - Interface : **SwiftUI**
   - Language : **Swift**
   - Storage : **None**

### 2. Ajouter les fichiers au projet

1. Glisser-déposer tous les dossiers (`Models`, `ViewModels`, `Views`, `Services`, `Utilities`) dans le projet Xcode
2. Cocher **Copy items if needed**
3. Sélectionner le target **VBRank**

### 3. Ajouter GoogleService-Info.plist

1. Glisser-déposer le fichier `GoogleService-Info.plist` dans le projet
2. **IMPORTANT** : Vérifier qu'il est bien ajouté au target dans **Target Membership**

### 4. Configuration du Bundle Identifier

Dans les **Signing & Capabilities** du target :
- Bundle Identifier : `com.vbrank.app`

## Structure de la base de données Firestore

L'application se connecte aux collections Firestore suivantes :

### Collection `equipes`
```json
{
  "nom": "string",
  "ville": "string",
  "logoUrl": "string",
  "championnatId": "string",
  "rang": number,
  "points": number,
  "joues": number,
  "gagnes": number,
  "perdus": number,
  "setsPour": number,
  "setsContre": number
}
```

### Collection `matchs`
```json
{
  "championnatId": "string",
  "journee": number,
  "date": "string (ISO)",
  "heure": "string",
  "equipeDomicileId": "string",
  "equipeDomicile": "string",
  "equipeExterieurId": "string",
  "equipeExterieur": "string",
  "scoreDomicile": number,
  "scoreExterieur": number,
  "detailSets": ["string"],
  "statut": "termine" | "a_venir"
}
```

## Build et Run

1. Sélectionner un simulateur ou device iOS 16+
2. Appuyer sur **Cmd + R** pour build et run
3. L'application devrait se lancer et afficher les données depuis Firestore

## Équivalences Angular → Swift

| Angular | Swift/SwiftUI |
|---------|---------------|
| Component | View |
| Service | Service / ViewModel |
| Observable / Signal | @Published / @State |
| ngOnInit | .onAppear / init |
| *ngFor | ForEach |
| *ngIf | if / @ViewBuilder |
| Firestore Observable | Combine + Firestore Listeners |

## Fonctionnalités avancées

### Mode sombre
SwiftUI gère automatiquement le mode sombre. Les couleurs utilisent le système de couleurs dynamiques d'Apple.

### Temps réel
Les données sont synchronisées en temps réel grâce aux **Firestore Listeners** dans le `FirestoreService`.

### Performance
- Utilisation de `LazyVStack` pour le rendu optimisé des listes
- Images chargées de manière asynchrone avec `AsyncImage`
- ViewModels avec `@MainActor` pour éviter les problèmes de thread

## Déploiement

Pour déployer l'application sur l'App Store :

1. Configurer le provisioning profile dans Xcode
2. Archiver l'application : **Product > Archive**
3. Distribuer via App Store Connect

## Support

Pour toute question ou problème :
- Vérifier que Firebase est bien configuré
- Vérifier les règles de sécurité Firestore
- Consulter la console Firebase pour les logs

## License

© 2025 VB Rank - Tous droits réservés
