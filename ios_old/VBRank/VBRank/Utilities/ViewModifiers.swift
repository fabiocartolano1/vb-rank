import SwiftUI

// MARK: - Glow Effect (effet lueur rose)

struct GlowEffect: ViewModifier {
    let color: Color
    let radius: CGFloat

    func body(content: Content) -> some View {
        content
            .shadow(color: color.opacity(0.6), radius: radius/3, x: 0, y: 0)
            .shadow(color: color.opacity(0.4), radius: radius*2/3, x: 0, y: 0)
            .shadow(color: color.opacity(0.3), radius: radius, x: 2, y: 2)
    }
}

extension View {
    /// Ajoute un effet de lueur (glow) rose autour du texte
    func pinkGlow(radius: CGFloat = 20) -> some View {
        self.modifier(GlowEffect(color: .vbPrimary, radius: radius))
    }

    /// Ajoute un effet de lueur personnalisé
    func glow(color: Color, radius: CGFloat = 20) -> some View {
        self.modifier(GlowEffect(color: color, radius: radius))
    }
}

// MARK: - Card Style

struct CardStyle: ViewModifier {
    @Environment(\.colorScheme) var colorScheme

    func body(content: Content) -> some View {
        content
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(colorScheme == .dark ? Color.vbDarkCardBackground : Color.vbCardBackground)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(Color.vbPrimary.opacity(0.1), lineWidth: 1)
            )
            .shadow(color: Color.black.opacity(0.1), radius: 8, x: 0, y: 4)
    }
}

extension View {
    /// Style de carte avec fond et ombre
    func cardStyle() -> some View {
        self.modifier(CardStyle())
    }
}

// MARK: - Cres Team Highlight

struct CresHighlight: ViewModifier {
    func body(content: Content) -> some View {
        content
            .background(
                LinearGradient(
                    gradient: Gradient(colors: [
                        Color.vbPrimary.opacity(0.15),
                        Color.vbPrimary.opacity(0.06)
                    ]),
                    startPoint: .leading,
                    endPoint: .trailing
                )
            )
            .overlay(
                Rectangle()
                    .fill(Color.vbPrimary)
                    .frame(width: 4),
                alignment: .leading
            )
            .overlay(
                Rectangle()
                    .stroke(Color.vbPrimary.opacity(0.4), lineWidth: 1),
                alignment: .top
            )
            .overlay(
                Rectangle()
                    .stroke(Color.vbPrimary.opacity(0.4), lineWidth: 1),
                alignment: .bottom
            )
    }
}

extension View {
    /// Mise en évidence pour les équipes/matchs du Crès
    func cresHighlight() -> some View {
        self.modifier(CresHighlight())
    }
}

// MARK: - Pill Button Style (pour les sélecteurs de championnat)

struct PillButtonStyle: ButtonStyle {
    let isSelected: Bool

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(size: 13, weight: isSelected ? .bold : .semibold))
            .foregroundColor(isSelected ? .white : .primary)
            .padding(.horizontal, 20)
            .padding(.vertical, 10)
            .background(
                Capsule()
                    .fill(isSelected ? Color.vbPrimary : Color.vbPrimary.opacity(0.1))
            )
            .overlay(
                Capsule()
                    .stroke(isSelected ? Color.vbPrimaryBorder : Color.vbPrimary.opacity(0.4), lineWidth: 2)
            )
            .scaleEffect(configuration.isPressed ? 0.95 : 1.0)
            .shadow(
                color: isSelected ? Color.vbPrimary.opacity(0.3) : Color.clear,
                radius: 8,
                x: 0,
                y: 2
            )
            .animation(.easeOut(duration: 0.2), value: configuration.isPressed)
    }
}

// MARK: - Bounce Animation

extension View {
    /// Animation de rebond au tap
    func bounceOnTap() -> some View {
        self.scaleEffect(1.0)
            .animation(.spring(response: 0.3, dampingFraction: 0.6), value: UUID())
    }
}

// MARK: - Primary Button Style

struct VBPrimaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(size: 16, weight: .bold))
            .foregroundColor(.white)
            .padding(.horizontal, 32)
            .padding(.vertical, 14)
            .background(
                Capsule()
                    .fill(Color.vbPrimary)
            )
            .shadow(
                color: Color.vbPrimary.opacity(0.3),
                radius: 8,
                x: 0,
                y: 4
            )
            .scaleEffect(configuration.isPressed ? 0.95 : 1.0)
            .animation(.easeOut(duration: 0.2), value: configuration.isPressed)
    }
}

extension ButtonStyle where Self == VBPrimaryButtonStyle {
    static var vbPrimary: VBPrimaryButtonStyle {
        VBPrimaryButtonStyle()
    }
}
