import Foundation
import Combine
import FirebaseFirestore

/// ViewModel pour la vue des matchs
@MainActor
class MatchesViewModel: ObservableObject {
    @Published var matches: [Match] = []
    @Published var teams: [Team] = []
    @Published var selectedChampionshipId: String = "nationale-3-f"
    @Published var isLoading: Bool = true
    @Published var errorMessage: String?
    @Published var expandedJournees: Set<Int> = []

    private let firestoreService = FirestoreService.shared
    private var matchesListener: ListenerRegistration?
    private var teamsListener: ListenerRegistration?

    /// Matchs filtrés par championnat sélectionné
    var filteredMatches: [Match] {
        return matches.filter { $0.championnatId == selectedChampionshipId && $0.isValid }
    }

    /// Matchs groupés par journée
    var matchesByJournee: [(journee: Int, matches: [Match])] {
        let grouped = Dictionary(grouping: filteredMatches) { $0.journee }
        return grouped.sorted { $0.key < $1.key }
            .map { (journee: $0.key, matches: $0.value.sorted { ($0.date, $0.heure ?? "") < ($1.date, $1.heure ?? "") }) }
    }

    init() {
        startListening()
        openNextJournee()
    }

    deinit {
        matchesListener?.remove()
        teamsListener?.remove()
    }

    /// Démarre l'écoute en temps réel
    private func startListening() {
        isLoading = true

        matchesListener = firestoreService.observeMatches { [weak self] matches in
            self?.matches = matches
            self?.isLoading = false
            self?.openNextJournee()
        }

        teamsListener = firestoreService.observeTeams { [weak self] teams in
            self?.teams = teams
        }
    }

    /// Change le championnat sélectionné
    func selectChampionship(_ championshipId: String) {
        selectedChampionshipId = championshipId
        openNextJournee()
    }

    /// Toggle l'expansion d'une journée
    func toggleJournee(_ journee: Int) {
        if expandedJournees.contains(journee) {
            expandedJournees.remove(journee)
        } else {
            expandedJournees.insert(journee)
        }
    }

    /// Ouvre automatiquement la prochaine journée à venir
    private func openNextJournee() {
        let today = Date()
        let nextJournee = filteredMatches
            .filter { match in
                guard let matchDate = match.matchDate else { return false }
                return matchDate >= today && match.statut == .aVenir
            }
            .min { match1, match2 in
                guard let date1 = match1.matchDate, let date2 = match2.matchDate else { return false }
                return date1 < date2
            }

        if let journee = nextJournee?.journee {
            expandedJournees = [journee]
        }
    }

    /// Retourne le logo d'une équipe
    func getTeamLogo(teamName: String) -> String {
        return teams.first { $0.nom == teamName }?.logoUrl ?? Constants.defaultTeamLogo
    }

    /// Formate une date
    func formatDate(_ dateString: String) -> String {
        guard let date = DateFormatter.iso8601.date(from: dateString) else {
            return dateString
        }
        return DateFormatter.shortDate.string(from: date)
    }
}
