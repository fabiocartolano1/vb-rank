import Foundation
import FirebaseFirestore

/// Modèle représentant une équipe de volley-ball
struct Team: Identifiable, Codable {
    @DocumentID var id: String?
    let nom: String
    let ville: String?
    let logoUrl: String?
    let championnatId: String

    // Données de classement
    let rang: Int
    let points: Int
    let joues: Int
    let gagnes: Int
    let perdus: Int
    let setsPour: Int
    let setsContre: Int

    /// Calcule la différence de sets
    var setsDifference: Int {
        return setsPour - setsContre
    }

    /// Vérifie si c'est l'équipe du Crès
    var isCresTeam: Bool {
        return nom.lowercased().contains("crès") || nom.lowercased().contains("cres")
    }
}
