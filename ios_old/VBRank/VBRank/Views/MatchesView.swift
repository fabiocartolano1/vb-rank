import SwiftUI

/// Vue de la liste des matchs - Version stylisée
struct MatchesView: View {
    @StateObject private var viewModel = MatchesViewModel()

    var body: some View {
        ZStack(alignment: .top) {
            Color.vbBackground
                .ignoresSafeArea()

            VStack(spacing: 0) {
                // Header
                VBHeader()

                // Sélecteur de championnat
                ChampionshipPicker(
                    championships: Championships.all,
                    selectedChampionshipId: $viewModel.selectedChampionshipId
                )

                if viewModel.isLoading {
                    Spacer()
                    ProgressView("Chargement des matchs...")
                        .tint(.vbPrimary)
                    Spacer()
                } else if let error = viewModel.errorMessage {
                    Spacer()
                    Text(error)
                        .foregroundColor(.vbDanger)
                        .padding()
                    Spacer()
                } else {
                    // Liste des journées
                    ScrollView {
                        LazyVStack(spacing: 16) {
                            ForEach(viewModel.matchesByJournee, id: \.journee) { item in
                                JourneeSection(
                                    journee: item.journee,
                                    matches: item.matches,
                                    isExpanded: viewModel.expandedJournees.contains(item.journee),
                                    viewModel: viewModel
                                )
                            }
                        }
                        .padding(16)
                        .padding(.bottom, 60)
                    }
                }
            }
        }
    }
}

// MARK: - Section d'une journée

private struct JourneeSection: View {
    let journee: Int
    let matches: [Match]
    let isExpanded: Bool
    let viewModel: MatchesViewModel

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // En-tête de la journée (cliquable)
            Button(action: {
                withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                    viewModel.toggleJournee(journee)
                }
            }) {
                HStack {
                    Text("Journée \(journee)")
                        .font(.system(size: 18, weight: .bold))
                        .foregroundColor(.primary)

                    Spacer()

                    Image(systemName: isExpanded ? "chevron.up" : "chevron.down")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(.vbPrimary)
                }
                .padding()
                .background(Color(.systemGray6))
                .cornerRadius(8)
            }

            // Liste des matchs (si déplié)
            if isExpanded {
                ForEach(matches) { match in
                    StyledMatchCard(
                        match: match,
                        homeTeamLogo: viewModel.getTeamLogo(teamName: match.equipeDomicile),
                        awayTeamLogo: viewModel.getTeamLogo(teamName: match.equipeExterieur),
                        isCresMatch: match.isCresMatch,
                        formattedDate: viewModel.formatDate(match.date)
                    )
                }
            }
        }
        .id(journee)
    }
}

// MARK: - Carte de match stylisée

private struct StyledMatchCard: View {
    let match: Match
    let homeTeamLogo: String
    let awayTeamLogo: String
    let isCresMatch: Bool
    let formattedDate: String

    var body: some View {
        VStack(spacing: 16) {
            // Date et heure
            HStack {
                if let heure = match.heure {
                    HStack(spacing: 4) {
                        Image(systemName: "clock")
                            .font(.caption)
                            .foregroundColor(.vbPrimary)
                        Text(heure)
                            .font(.system(size: 15, weight: .semibold))
                            .foregroundColor(.primary)
                    }
                }

                Spacer()

                Text(formattedDate)
                    .font(.caption)
                    .foregroundColor(.secondary)
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
                    VStack(spacing: 4) {
                        HStack(spacing: 8) {
                            Text("\(scoreDom)")
                                .font(.system(size: 28, weight: .bold))
                                .foregroundColor(.primary)
                            Text("-")
                                .font(.title2)
                                .foregroundColor(.secondary)
                            Text("\(scoreExt)")
                                .font(.system(size: 28, weight: .bold))
                                .foregroundColor(.primary)
                        }
                        if let detailSets = match.detailSets {
                            Text(detailSets.joined(separator: ", "))
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                } else {
                    Text("VS")
                        .font(.title3)
                        .fontWeight(.bold)
                        .foregroundColor(.vbPrimary)
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
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(isCresMatch ? Color.vbPrimary.opacity(0.05) : Color(.systemBackground))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(isCresMatch ? Color.vbPrimary : Color(.systemGray5), lineWidth: isCresMatch ? 2 : 1)
        )
        .shadow(color: Color.black.opacity(0.08), radius: 4, x: 0, y: 2)
    }
}

#Preview {
    MatchesView()
}
