import Foundation
import Combine
import FirebaseFirestore

/// ViewModel pour la vue de classement
@MainActor
class RankingsViewModel: ObservableObject {
    @Published var teams: [Team] = []
    @Published var selectedChampionshipId: String = "nationale-3-f"
    @Published var isLoading: Bool = true
    @Published var errorMessage: String?

    private let firestoreService = FirestoreService.shared
    private var listener: ListenerRegistration?

    /// Équipes filtrées par championnat sélectionné
    var filteredTeams: [Team] {
        return teams.filter { $0.championnatId == selectedChampionshipId }
    }

    init() {
        startListening()
    }

    deinit {
        listener?.remove()
    }

    /// Démarre l'écoute en temps réel des équipes
    private func startListening() {
        isLoading = true
        listener = firestoreService.observeTeams { [weak self] teams in
            self?.teams = teams
            self?.isLoading = false
        }
    }

    /// Change le championnat sélectionné
    func selectChampionship(_ championshipId: String) {
        selectedChampionshipId = championshipId
    }

    /// Retourne la classe CSS pour le rang (pour les médailles)
    func getRankClass(for rank: Int) -> String {
        switch rank {
        case 1: return Constants.RankColors.gold
        case 2: return Constants.RankColors.silver
        case 3: return Constants.RankColors.bronze
        default: return ""
        }
    }
}
