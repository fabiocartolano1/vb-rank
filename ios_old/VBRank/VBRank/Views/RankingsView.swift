import SwiftUI

/// Vue du classement des équipes - Version stylisée
struct RankingsView: View {
    @StateObject private var viewModel = RankingsViewModel()

    var body: some View {
        ZStack(alignment: .top) {
            // Background
            Color.vbBackground
                .ignoresSafeArea()

            VStack(spacing: 0) {
                // Header avec logo et titre
                VBHeader()

                // Sélecteur de championnat (pills)
                ChampionshipPicker(
                    championships: Championships.all,
                    selectedChampionshipId: $viewModel.selectedChampionshipId
                )

                // Contenu
                if viewModel.isLoading {
                    Spacer()
                    ProgressView("Chargement du classement...")
                        .tint(.vbPrimary)
                    Spacer()
                } else if let error = viewModel.errorMessage {
                    Spacer()
                    Text(error)
                        .foregroundColor(.vbDanger)
                        .padding()
                    Spacer()
                } else {
                    // Tableau de classement
                    ScrollView {
                        VStack(spacing: 0) {
                            // En-tête du tableau
                            TableHeader()

                            // Lignes du classement
                            ForEach(viewModel.filteredTeams) { team in
                                TeamRow(team: team, viewModel: viewModel)
                                    .background(team.isCresTeam ? Color.clear : Color(.systemBackground))
                                    .modifier(team.isCresTeam ? AnyViewModifier(CresHighlight()) : AnyViewModifier(EmptyModifier()))
                                Divider()
                                    .padding(.leading, 20)
                            }
                        }
                        .background(Color(.systemBackground))
                        .cornerRadius(12)
                        .shadow(color: Color.black.opacity(0.1), radius: 8, x: 0, y: 4)
                        .padding(.horizontal, 16)
                        .padding(.top, 16)
                        .padding(.bottom, 80) // Espace pour la TabBar
                    }
                }
            }
        }
    }
}

// MARK: - Table Header

private struct TableHeader: View {
    var body: some View {
        HStack(spacing: 8) {
            Text("Rang")
                .frame(width: 50, alignment: .center)
            Text("Équipe")
                .frame(maxWidth: .infinity, alignment: .leading)
            Text("Pts")
                .frame(width: 40, alignment: .center)
            Text("J")
                .frame(width: 35, alignment: .center)
            Text("G")
                .frame(width: 35, alignment: .center)
            Text("P")
                .frame(width: 35, alignment: .center)
            Text("Diff")
                .frame(width: 45, alignment: .center)
        }
        .font(.system(size: 12, weight: .bold))
        .foregroundColor(.white)
        .padding(.horizontal, 20)
        .padding(.vertical, 12)
        .background(
            LinearGradient.vbHeader
                .overlay(
                    Rectangle()
                        .fill(Color.vbPrimary)
                        .frame(height: 2),
                    alignment: .bottom
                )
        )
    }
}

// MARK: - Team Row

private struct TeamRow: View {
    let team: Team
    let viewModel: RankingsViewModel

    var body: some View {
        HStack(spacing: 8) {
            // Badge de rang avec médailles
            RankBadge(rank: team.rang)
                .frame(width: 50)

            // Logo et nom de l'équipe
            HStack(spacing: 8) {
                TeamLogoView(logoUrl: team.logoUrl, size: 30)
                Text(team.nom)
                    .font(.system(size: 14, weight: team.isCresTeam ? .bold : .regular))
                    .lineLimit(1)
                    .foregroundColor(.primary)
            }
            .frame(maxWidth: .infinity, alignment: .leading)

            // Points (rose et gras)
            Text("\(team.points)")
                .font(.system(size: 14, weight: .bold))
                .foregroundColor(.vbPrimary)
                .frame(width: 40, alignment: .center)

            // Matchs joués
            Text("\(team.joues)")
                .font(.system(size: 13))
                .foregroundColor(.secondary)
                .frame(width: 35, alignment: .center)

            // Matchs gagnés (vert)
            Text("\(team.gagnes)")
                .font(.system(size: 13, weight: .medium))
                .foregroundColor(.vbSuccess)
                .frame(width: 35, alignment: .center)

            // Matchs perdus (rouge)
            Text("\(team.perdus)")
                .font(.system(size: 13, weight: .medium))
                .foregroundColor(.vbDanger)
                .frame(width: 35, alignment: .center)

            // Différence de sets
            Text(team.setsDifference > 0 ? "+\(team.setsDifference)" : "\(team.setsDifference)")
                .font(.system(size: 13, weight: .semibold))
                .foregroundColor(team.setsDifference > 0 ? .vbSuccess : (team.setsDifference < 0 ? .vbDanger : .secondary))
                .frame(width: 45, alignment: .center)
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 12)
    }
}

// MARK: - Rank Badge (avec médailles)

private struct RankBadge: View {
    let rank: Int

    var body: some View {
        ZStack {
            Circle()
                .fill(badgeGradient)
                .frame(width: 35, height: 35)
                .shadow(color: shadowColor, radius: 4, x: 0, y: 2)

            Text("\(rank)")
                .font(.system(size: 14, weight: .bold))
                .foregroundColor(textColor)
        }
    }

    private var badgeGradient: LinearGradient {
        switch rank {
        case 1:
            return LinearGradient.vbGoldMedal
        case 2:
            return LinearGradient.vbSilverMedal
        case 3:
            return LinearGradient.vbBronzeMedal
        default:
            return LinearGradient(
                gradient: Gradient(colors: [Color(.systemGray5), Color(.systemGray4)]),
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        }
    }

    private var shadowColor: Color {
        switch rank {
        case 1: return Color.vbGold.opacity(0.5)
        case 2: return Color.vbSilver.opacity(0.5)
        case 3: return Color.vbBronze.opacity(0.5)
        default: return Color.clear
        }
    }

    private var textColor: Color {
        switch rank {
        case 1, 2: return .black
        case 3: return .white
        default: return .primary
        }
    }
}

// MARK: - Helper pour les modifiers conditionnels

struct AnyViewModifier: ViewModifier {
    private let _body: (Content) -> AnyView

    init<M: ViewModifier>(_ modifier: M) {
        _body = { AnyView(modifier.body(content: $0)) }
    }

    func body(content: Content) -> some View {
        _body(content)
    }
}

struct EmptyModifier: ViewModifier {
    func body(content: Content) -> some View {
        content
    }
}

#Preview {
    RankingsView()
}
