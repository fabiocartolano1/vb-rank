import Foundation

extension DateFormatter {
    /// Formateur pour les dates courtes (ex: "Sam 15 fév")
    static let shortDate: DateFormatter = {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "fr_FR")
        formatter.dateFormat = "EEE d MMM"
        return formatter
    }()

    /// Formateur pour les dates longues (ex: "Samedi 15 février 2025")
    static let longDate: DateFormatter = {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "fr_FR")
        formatter.dateStyle = .full
        return formatter
    }()

    /// Formateur pour les dates compactes (ex: "15/02")
    static let compactDate: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateFormat = "dd/MM"
        return formatter
    }()

    /// Formateur ISO pour parser les dates depuis Firestore
    static let iso8601: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withFullDate, .withDashSeparatorInDate]
        return formatter
    }()
}

extension Date {
    /// Retourne le samedi de la semaine contenant cette date
    func getSaturday() -> Date {
        let calendar = Calendar.current
        let weekday = calendar.component(.weekday, from: self)

        // weekday: 1 = Dimanche, 7 = Samedi
        var daysToAdd = 0
        if weekday == 1 { // Dimanche
            daysToAdd = -1
        } else if weekday != 7 { // Pas samedi
            daysToAdd = 7 - weekday
        }

        return calendar.date(byAdding: .day, value: daysToAdd, to: self) ?? self
    }

    /// Retourne le dimanche suivant ce samedi
    func getSunday() -> Date {
        return Calendar.current.date(byAdding: .day, value: 1, to: self) ?? self
    }

    /// Retourne true si la date est aujourd'hui ou dans le futur
    var isUpcoming: Bool {
        return self >= Calendar.current.startOfDay(for: Date())
    }
}
