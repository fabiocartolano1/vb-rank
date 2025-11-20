import SwiftUI

/// Header de l'application avec le logo et le titre du club
struct VBHeader: View {
    var body: some View {
        ZStack {
            // Background avec gradient noir et effet de cercle rose
            LinearGradient.vbHeader
                .overlay(
                    Circle()
                        .fill(Color.vbPrimary.opacity(0.1))
                        .frame(width: 300, height: 300)
                        .offset(x: 100, y: -100)
                        .blur(radius: 50),
                    alignment: .topTrailing
                )

            VStack(spacing: 0) {
                // Logo + Titre
                HStack(spacing: 12) {
                    // Logo du club (fallback vers SF Symbol si pas de logo)
                    Image(systemName: "volleyball.fill")
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                        .frame(width: 35, height: 35)
                        .foregroundColor(.white.opacity(0.9))
                        .cornerRadius(10)

                    // Titre avec effet glow
                    Text("Le Crès Volley-Ball")
                        .font(.system(size: 28, weight: .heavy, design: .rounded))
                        .foregroundColor(.white)
                        .pinkGlow(radius: 20)
                        .textCase(.none)

                    Spacer()
                }
                .padding(.horizontal, 20)
                .padding(.top, 20)
                .padding(.bottom, 20)
            }
        }
        .frame(maxWidth: .infinity)
        .overlay(
            // Bordure rose en bas
            Rectangle()
                .fill(Color.vbPrimary)
                .frame(height: 3),
            alignment: .bottom
        )
    }
}

/// Header compact (utilisé quand on scroll)
struct VBHeaderCompact: View {
    var body: some View {
        ZStack {
            LinearGradient.vbHeader

            HStack(spacing: 10) {
                Image(systemName: "volleyball.fill")
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .frame(width: 25, height: 25)
                    .foregroundColor(.white.opacity(0.9))

                Text("Le Crès VB")
                    .font(.system(size: 20, weight: .bold, design: .rounded))
                    .foregroundColor(.white)
                    .pinkGlow(radius: 12)

                Spacer()
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 12)
        }
        .frame(maxWidth: .infinity)
        .overlay(
            Rectangle()
                .fill(Color.vbPrimary)
                .frame(height: 3),
            alignment: .bottom
        )
    }
}

#Preview {
    VStack {
        VBHeader()
        Spacer()
    }
    .background(Color.gray.opacity(0.2))
}
