import SwiftUI

/// Vue affichant le logo d'une équipe
struct TeamLogoView: View {
    let logoUrl: String?
    let size: CGFloat

    var body: some View {
        AsyncImage(url: URL(string: logoUrl ?? Constants.defaultTeamLogo)) { phase in
            switch phase {
            case .empty:
                ProgressView()
                    .frame(width: size, height: size)
            case .success(let image):
                image
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .frame(width: size, height: size)
            case .failure:
                Image(systemName: "photo")
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .frame(width: size, height: size)
                    .foregroundColor(.gray)
            @unknown default:
                EmptyView()
            }
        }
        .clipShape(Circle())
    }
}
