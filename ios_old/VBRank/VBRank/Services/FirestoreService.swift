import Foundation
import FirebaseFirestore
import Combine

/// Service de gestion de la connexion à Firestore
@MainActor
class FirestoreService: ObservableObject {
    static let shared = FirestoreService()
    private let db = Firestore.firestore()

    private init() {}

    /// Récupère toutes les équipes, triées par rang
    func fetchTeams() async throws -> [Team] {
        let snapshot = try await db.collection("equipes")
            .order(by: "rang")
            .getDocuments()

        return snapshot.documents.compactMap { document in
            try? document.data(as: Team.self)
        }
    }

    /// Récupère tous les matchs
    func fetchMatches() async throws -> [Match] {
        let snapshot = try await db.collection("matchs")
            .getDocuments()

        return snapshot.documents.compactMap { document in
            try? document.data(as: Match.self)
        }
    }

    /// Écoute les changements en temps réel des équipes
    func observeTeams(completion: @escaping ([Team]) -> Void) -> ListenerRegistration {
        return db.collection("equipes")
            .order(by: "rang")
            .addSnapshotListener { snapshot, error in
                guard let documents = snapshot?.documents else {
                    print("Error fetching teams: \(error?.localizedDescription ?? "Unknown error")")
                    return
                }

                let teams = documents.compactMap { document in
                    try? document.data(as: Team.self)
                }
                completion(teams)
            }
    }

    /// Écoute les changements en temps réel des matchs
    func observeMatches(completion: @escaping ([Match]) -> Void) -> ListenerRegistration {
        return db.collection("matchs")
            .addSnapshotListener { snapshot, error in
                guard let documents = snapshot?.documents else {
                    print("Error fetching matches: \(error?.localizedDescription ?? "Unknown error")")
                    return
                }

                let matches = documents.compactMap { document in
                    try? document.data(as: Match.self)
                }
                completion(matches)
            }
    }
}
