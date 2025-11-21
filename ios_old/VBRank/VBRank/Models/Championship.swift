import Foundation

/// Modèle représentant un championnat
struct Championship: Identifiable, Hashable {
    let id: String
    let name: String
}

/// Liste exhaustive des championnats gérés par l'application
struct Championships {
    static let all: [Championship] = [
        Championship(id: "nationale-3-f", name: "Nationale 3 F"),
        Championship(id: "prenationale-m", name: "Prénationale M"),
        Championship(id: "prenationale-f", name: "Prénationale F"),
        Championship(id: "regionale-2-m", name: "Régionale 2 M"),
        Championship(id: "regionale-2-f", name: "Régionale 2 F"),
        Championship(id: "m18-m", name: "M18 M"),
        Championship(id: "bfc", name: "Benjamines"),
        Championship(id: "bmb", name: "Benjamins"),
        Championship(id: "mfd", name: "Minimes F"),
        Championship(id: "mmb", name: "Minimes M"),
        Championship(id: "cfd", name: "Cadettes")
    ]

    static let adults: [Championship] = Array(all.prefix(5))

    static func getName(for id: String) -> String {
        return all.first { $0.id == id }?.name ?? id
    }
}
