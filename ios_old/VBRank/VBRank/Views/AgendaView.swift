import SwiftUI

/// Vue de l'agenda des matchs à domicile du Crès
struct AgendaView: View {
    @StateObject private var viewModel = AgendaViewModel()

    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                if viewModel.isLoading {
                    Spacer()
                    ProgressView("Chargement de l'agenda...")
                    Spacer()
                } else if let error = viewModel.errorMessage {
                    Spacer()
                    Text(error)
                        .foregroundColor(.vbDanger)
                    Spacer()
                } else {
                    // Navigation weekend
                    HStack {
                        Button(action: {
                            viewModel.previousWeekend()
                        }) {
                            Image(systemName: "chevron.left")
                                .font(.title2)
                        }
                        .disabled(!viewModel.canGoPrevious)

                        Spacer()

                        VStack {
                            Text("Weekend du")
                                .font(.caption)
                                .foregroundColor(.secondary)
                            Text(viewModel.formatDate(viewModel.currentWeekend, style: "short"))
                                .font(.headline)
                        }

                        Spacer()

                        Button(action: {
                            viewModel.nextWeekend()
                        }) {
                            Image(systemName: "chevron.right")
                                .font(.title2)
                        }
                        .disabled(!viewModel.canGoNext)
                    }
                    .padding()
                    .background(Color(.systemGray6))

                    // Matchs du weekend
                    ScrollView {
                        VStack(spacing: 24) {
                            // Samedi
                            DaySection(
                                day: "Samedi",
                                date: viewModel.currentWeekend,
                                matches: viewModel.saturdayMatches,
                                viewModel: viewModel
                            )

                            // Dimanche
                            DaySection(
                                day: "Dimanche",
                                date: viewModel.currentSunday,
                                matches: viewModel.sundayMatches,
                                viewModel: viewModel
                            )
                        }
                        .padding()
                    }
                }
            }
            .navigationTitle("Agenda")
        }
    }
}

/// Section d'une journée (samedi ou dimanche)
private struct DaySection: View {
    let day: String
    let date: Date
    let matches: [Match]
    let viewModel: AgendaViewModel

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // En-tête du jour
            HStack {
                Text(day)
                    .font(.title2)
                    .fontWeight(.bold)
                Text(viewModel.formatDate(date, style: "compact"))
                    .font(.title3)
                    .foregroundColor(.secondary)
            }
            .padding(.bottom, 4)

            // Liste des matchs
            if matches.isEmpty {
                Text("Aucun match")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .italic()
                    .padding()
            } else {
                ForEach(matches) { match in
                    AgendaMatchCard(match: match, viewModel: viewModel)
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

/// Carte de match pour l'agenda
private struct AgendaMatchCard: View {
    let match: Match
    let viewModel: AgendaViewModel

    var body: some View {
        VStack(spacing: 16) {
            // Heure et championnat
            HStack {
                if let heure = match.heure {
                    HStack(spacing: 4) {
                        Image(systemName: "clock")
                            .font(.caption)
                        Text(heure)
                            .font(.headline)
                    }
                }
                Spacer()
                if let championnatId = match.championnatId {
                    Text(Championships.getName(for: championnatId))
                        .font(.caption)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Color.vbPrimary.opacity(0.2))
                        .cornerRadius(8)
                }
            }

            // Équipes et score
            HStack(spacing: 20) {
                // Équipe du Crès (domicile)
                VStack(spacing: 8) {
                    if let cresTeam = viewModel.getCresTeam(for: match) {
                        TeamLogoView(logoUrl: cresTeam.logoUrl, size: 60)
                        Text(cresTeam.nom)
                            .font(.subheadline)
                            .fontWeight(.bold)
                            .multilineTextAlignment(.center)
                            .lineLimit(2)
                            .frame(maxWidth: 100)
                    }
                }

                // Score ou VS
                if match.statut == .termine,
                   let scoreDom = match.scoreDomicile,
                   let scoreExt = match.scoreExterieur {
                    VStack(spacing: 4) {
                        HStack(spacing: 8) {
                            Text("\(scoreDom)")
                                .font(.system(size: 32, weight: .bold))
                            Text("-")
                                .font(.title2)
                                .foregroundColor(.secondary)
                            Text("\(scoreExt)")
                                .font(.system(size: 32, weight: .bold))
                        }

                        // Indicateur victoire/défaite
                        if viewModel.isMatchWon(match) {
                            Text("Victoire")
                                .font(.caption)
                                .fontWeight(.bold)
                                .foregroundColor(.white)
                                .padding(.horizontal, 12)
                                .padding(.vertical, 4)
                                .background(Color.vbSuccess)
                                .cornerRadius(8)
                        } else if viewModel.isMatchLost(match) {
                            Text("Défaite")
                                .font(.caption)
                                .fontWeight(.bold)
                                .foregroundColor(.white)
                                .padding(.horizontal, 12)
                                .padding(.vertical, 4)
                                .background(Color.vbDanger)
                                .cornerRadius(8)
                        }

                        if let detailSets = match.detailSets {
                            Text(detailSets.joined(separator: ", "))
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                } else {
                    Text("VS")
                        .font(.title2)
                        .foregroundColor(.secondary)
                }

                // Équipe adverse (extérieur)
                VStack(spacing: 8) {
                    if let opponent = viewModel.getOpponentTeam(for: match) {
                        TeamLogoView(logoUrl: opponent.logoUrl, size: 60)
                        Text(opponent.nom)
                            .font(.subheadline)
                            .multilineTextAlignment(.center)
                            .lineLimit(2)
                            .frame(maxWidth: 100)
                    } else {
                        // Si pas de logo, afficher juste le nom
                        VStack {
                            Image(systemName: "person.3.fill")
                                .font(.system(size: 30))
                                .foregroundColor(.gray)
                                .frame(width: 60, height: 60)
                            Text(match.equipeExterieur)
                                .font(.subheadline)
                                .multilineTextAlignment(.center)
                                .lineLimit(2)
                                .frame(maxWidth: 100)
                        }
                    }
                }
            }
            .frame(maxWidth: .infinity)
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color(.systemBackground))
                .shadow(color: .black.opacity(0.1), radius: 8, x: 0, y: 2)
        )
    }
}
