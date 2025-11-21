import SwiftUI

/// Système de couleurs de l'application VB Rank - Le Crès Volley-Ball
extension Color {
    // MARK: - Couleurs principales

    /// Couleur principale rose/fuchsia du club (#f762a6)
    static let vbPrimary = Color(hex: "f762a6")

    /// Variantes de la couleur primaire
    static let vbPrimaryLight = Color(hex: "ff7bb8")
    static let vbPrimaryDark = Color(hex: "e5508f")
    static let vbPrimaryBorder = Color(hex: "c63185")

    // MARK: - Couleurs de succès/erreur

    static let vbSuccess = Color(hex: "27ae60")
    static let vbDanger = Color(hex: "e74c3c")
    static let vbWarning = Color(hex: "f39c12")
    static let vbInfo = Color(hex: "3498db")

    // MARK: - Couleurs de médailles

    static let vbGold = Color(hex: "ffd700")
    static let vbGoldLight = Color(hex: "ffed4e")
    static let vbSilver = Color(hex: "c0c0c0")
    static let vbSilverLight = Color(hex: "e8e8e8")
    static let vbBronze = Color(hex: "cd7f32")
    static let vbBronzeLight = Color(hex: "e8a87c")

    // MARK: - Couleurs de fond

    static let vbBackground = Color(hex: "f8f8f8")
    static let vbDarkBackground = Color(hex: "0f0f0f")
    static let vbCardBackground = Color(hex: "ffffff")
    static let vbDarkCardBackground = Color(hex: "1a1a1a")

    // MARK: - Helper pour créer des couleurs depuis hex

    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (1, 1, 1, 0)
        }

        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue:  Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}

/// Gradients utilisés dans l'application
extension LinearGradient {
    /// Gradient du header (noir vers gris foncé)
    static let vbHeader = LinearGradient(
        gradient: Gradient(colors: [Color(hex: "1a1a1a"), Color(hex: "2a2a2a")]),
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )

    /// Gradient pour les médailles d'or
    static let vbGoldMedal = LinearGradient(
        gradient: Gradient(colors: [Color.vbGold, Color.vbGoldLight]),
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )

    /// Gradient pour les médailles d'argent
    static let vbSilverMedal = LinearGradient(
        gradient: Gradient(colors: [Color.vbSilver, Color.vbSilverLight]),
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )

    /// Gradient pour les médailles de bronze
    static let vbBronzeMedal = LinearGradient(
        gradient: Gradient(colors: [Color.vbBronze, Color.vbBronzeLight]),
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )
}
