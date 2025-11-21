import Foundation
import Combine
import FirebaseFirestore

/// ViewModel pour la vue agenda
@MainActor
class AgendaViewModel: ObservableObject {
    @Published var matches: [Match] = []
    @Published var teams: [Team] = []
    @Published var currentWeekendIndex: Int = 0
    @Published var isLoading: Bool = true
    @Published var errorMessage: String?

    private let firestoreService = FirestoreService.shared
    private var matchesListener: ListenerRegistration?
    private var teamsListener: ListenerRegistration?

    /// Tous les weekends disponibles (samedi)
    var weekends: [Date] {
        let cresHomeMatches = matches.filter { $0.isCresHome && $0.isValid }
        let weekendDates = Set(cresHomeMatches.compactMap { match -> Date? in
            guard let matchDate = match.matchDate else { return nil }
            return matchDate.getSaturday()
        })
        return weekendDates.sorted()
    }

    /// Weekend actuellement affiché
    var currentWeekend: Date {
        guard !weekends.isEmpty, currentWeekendIndex < weekends.count else {
            return Date()
        }
        return weekends[currentWeekendIndex]
    }

    /// Dimanche du weekend actuel
    var currentSunday: Date {
        return currentWeekend.getSunday()
    }

    /// Matchs du samedi
    var saturdayMatches: [Match] {
        return getMatches(for: currentWeekend)
    }

    /// Matchs du dimanche
    var sundayMatches: [Match] {
        return getMatches(for: currentSunday)
    }

    init() {
        startListening()
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
            self?.goToNextWeekend()
        }

        teamsListener = firestoreService.observeTeams { [weak self] teams in
            self?.teams = teams
        }
    }

    /// Récupère les matchs pour une journée donnée
    private func getMatches(for date: Date) -> [Match] {
        let calendar = Calendar.current
        return matches.filter { match in
            guard let matchDate = match.matchDate else { return false }
            return calendar.isDate(matchDate, inSameDayAs: date) &&
                   match.isCresHome &&
                   match.isValid
        }.sorted { match1, match2 in
            let time1 = match1.heure ?? "00:00"
            let time2 = match2.heure ?? "00:00"
            return time1 < time2
        }
    }

    /// Navigue vers le weekend précédent
    func previousWeekend() {
        if currentWeekendIndex > 0 {
            currentWeekendIndex -= 1
        }
    }

    /// Navigue vers le weekend suivant
    func nextWeekend() {
        if currentWeekendIndex < weekends.count - 1 {
            currentWeekendIndex += 1
        }
    }

    /// Se positionne sur le prochain weekend à venir
    private func goToNextWeekend() {
        let now = Date()
        let nextIndex = weekends.firstIndex { weekend in
            let sunday = weekend.getSunday()
            return sunday >= now
        }

        if let index = nextIndex {
            currentWeekendIndex = index
        } else if !weekends.isEmpty {
            currentWeekendIndex = weekends.count - 1
        }
    }

    /// Retourne l'équipe du Crès pour un match
    func getCresTeam(for match: Match) -> Team? {
        return teams.first { $0.id == match.equipeDomicileId }
    }

    /// Retourne l'équipe adverse
    func getOpponentTeam(for match: Match) -> Team? {
        return teams.first { $0.id == match.equipeExterieurId }
    }

    /// Vérifie si le match est gagné
    func isMatchWon(_ match: Match) -> Bool {
        guard match.statut == .termine,
              let scoreDom = match.scoreDomicile,
              let scoreExt = match.scoreExterieur else {
            return false
        }
        return scoreDom > scoreExt
    }

    /// Vérifie si le match est perdu
    func isMatchLost(_ match: Match) -> Bool {
        guard match.statut == .termine,
              let scoreDom = match.scoreDomicile,
              let scoreExt = match.scoreExterieur else {
            return false
        }
        return scoreDom < scoreExt
    }

    /// Peut naviguer vers le weekend précédent
    var canGoPrevious: Bool {
        return currentWeekendIndex > 0
    }

    /// Peut naviguer vers le weekend suivant
    var canGoNext: Bool {
        return currentWeekendIndex < weekends.count - 1
    }

    /// Formate une date
    func formatDate(_ date: Date, style: String = "long") -> String {
        switch style {
        case "compact":
            return DateFormatter.compactDate.string(from: date)
        case "short":
            return DateFormatter.shortDate.string(from: date)
        default:
            return DateFormatter.longDate.string(from: date)
        }
    }
}
