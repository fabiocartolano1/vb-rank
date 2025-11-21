import Foundation
import FirebaseFirestore

/// Statut d'un match
enum MatchStatus: String, Codable {
    case termine = "termine"
    case aVenir = "a_venir"
}

/// Modèle représentant un match de volley-ball
struct Match: Identifiable, Codable {
    @DocumentID var id: String?
    let championnatId: String?
    let journee: Int
    let date: String // Format ISO (yyyy-MM-dd)
    let heure: String?
    let equipeDomicileId: String?
    let equipeDomicile: String
    let equipeExterieurId: String?
    let equipeExterieur: String
    let scoreDomicile: Int?
    let scoreExterieur: Int?
    let detailSets: [String]?
    let statut: MatchStatus

    /// Convertit la date string en Date
    var matchDate: Date? {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withFullDate, .withDashSeparatorInDate]
        return formatter.date(from: date)
    }

    /// Vérifie si le match implique l'équipe du Crès
    var isCresMatch: Bool {
        let domicileLower = equipeDomicile.lowercased()
        let exterieurLower = equipeExterieur.lowercased()
        return domicileLower.contains("crès") || domicileLower.contains("cres") ||
               exterieurLower.contains("crès") || exterieurLower.contains("cres")
    }

    /// Vérifie si le Crès joue à domicile
    var isCresHome: Bool {
        let domicileLower = equipeDomicile.lowercased()
        return domicileLower.contains("crès") || domicileLower.contains("cres")
    }

    /// Vérifie si le match est valide (pas de date/équipe vide)
    var isValid: Bool {
        return !date.isEmpty &&
               !equipeDomicile.isEmpty &&
               !equipeExterieur.isEmpty &&
               journee > 0
    }
}
