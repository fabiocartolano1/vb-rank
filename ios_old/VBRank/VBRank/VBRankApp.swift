import SwiftUI
import Firebase

/// Point d'entrée de l'application VB Rank
@main
struct VBRankApp: App {
    init() {
        // Initialiser Firebase
        FirebaseApp.configure()

        // Personnaliser la TabBar avec les couleurs de l'app
        let tabBarAppearance = UITabBarAppearance()
        tabBarAppearance.configureWithDefaultBackground()

        // Couleur de l'item sélectionné (rose)
        tabBarAppearance.stackedLayoutAppearance.selected.iconColor = UIColor(Color.vbPrimary)
        tabBarAppearance.stackedLayoutAppearance.selected.titleTextAttributes = [
            .foregroundColor: UIColor(Color.vbPrimary)
        ]

        // Couleur de l'item non sélectionné (gris)
        tabBarAppearance.stackedLayoutAppearance.normal.iconColor = UIColor.systemGray
        tabBarAppearance.stackedLayoutAppearance.normal.titleTextAttributes = [
            .foregroundColor: UIColor.systemGray
        ]

        UITabBar.appearance().standardAppearance = tabBarAppearance
        UITabBar.appearance().scrollEdgeAppearance = tabBarAppearance
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}
