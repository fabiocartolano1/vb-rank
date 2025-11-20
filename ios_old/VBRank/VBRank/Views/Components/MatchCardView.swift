import SwiftUI

/// Vue d'une carte de match
struct MatchCardView: View {
    let match: Match
    let homeTeamLogo: String?
    let awayTeamLogo: String?
    let isCresMatch: Bool

    var body: some View {
        VStack(spacing: 12) {
            // Heure et date
            if let heure = match.heure {
                Text(heure)
                    .font(.headline)
                    .foregroundColor(.primary)
            }

            // Équipes et score
            HStack(spacing: 20) {
                // Équipe domicile
                VStack(spacing: 8) {
                    TeamLogoView(logoUrl: homeTeamLogo, size: 50)
                    Text(match.equipeDomicile)
                        .font(.caption)
                        .multilineTextAlignment(.center)
                        .lineLimit(2)
                        .frame(maxWidth: 100)
                }

                // Score
                if match.statut == .termine,
                   let scoreDom = match.scoreDomicile,
                   let scoreExt = match.scoreExterieur {
                    VStack {
                        HStack(spacing: 8) {
                            Text("\(scoreDom)")
                                .font(.title)
                                .fontWeight(.bold)
                            Text("-")
                                .font(.title2)
                                .foregroundColor(.secondary)
                            Text("\(scoreExt)")
                                .font(.title)
                                .fontWeight(.bold)
                        }
                        if let detailSets = match.detailSets {
                            Text(detailSets.joined(separator: ", "))
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                } else {
                    Text("vs")
                        .font(.title3)
                        .foregroundColor(.secondary)
                }

                // Équipe extérieur
                VStack(spacing: 8) {
                    TeamLogoView(logoUrl: awayTeamLogo, size: 50)
                    Text(match.equipeExterieur)
                        .font(.caption)
                        .multilineTextAlignment(.center)
                        .lineLimit(2)
                        .frame(maxWidth: 100)
                }
            }

            // Journée
            Text("Journée \(match.journee)")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding()
        .cardStyle()
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(isCresMatch ? Color.vbPrimary : Color.clear, lineWidth: 2)
        )
        .shadow(
            color: isCresMatch ? Color.vbPrimary.opacity(0.3) : Color.clear,
            radius: 8,
            x: 0,
            y: 4
        )
    }
}
