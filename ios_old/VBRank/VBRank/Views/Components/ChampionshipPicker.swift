import SwiftUI

/// Sélecteur de championnat avec style pills
struct ChampionshipPicker: View {
    let championships: [Championship]
    @Binding var selectedChampionshipId: String

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 12) {
                ForEach(championships) { championship in
                    Button(action: {
                        withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                            selectedChampionshipId = championship.id
                        }
                    }) {
                        Text(championship.name.uppercased())
                            .font(.system(size: 13, weight: championship.id == selectedChampionshipId ? .bold : .semibold))
                            .lineLimit(1)
                    }
                    .buttonStyle(PillButtonStyle(isSelected: championship.id == selectedChampionshipId))
                }
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 12)
        }
        .background(Color(.systemBackground))
    }
}

#Preview {
    ChampionshipPicker(
        championships: Championships.all,
        selectedChampionshipId: .constant("nationale-3-f")
    )
}
