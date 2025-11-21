import SwiftUI

/// Vue principale de l'application avec navigation par onglets
struct ContentView: View {
    @State private var selectedTab = 0

    var body: some View {
        TabView(selection: $selectedTab) {
            // Classement
            RankingsView()
                .tabItem {
                    Label("Classement", systemImage: "list.number")
                }
                .tag(0)

            // Matchs
            MatchesView()
                .tabItem {
                    Label("Matchs", systemImage: "sportscourt")
                }
                .tag(1)

            // Agenda
            AgendaView()
                .tabItem {
                    Label("Agenda", systemImage: "calendar")
                }
                .tag(2)
        }
    }
}

#Preview {
    ContentView()
}
