import { Match } from '../../models/match.model';

/**
 * Formats de date disponibles pour l'affichage
 */
export type DateFormat = 'short' | 'long' | 'compact';

/**
 * Utilitaires pour la gestion des dates
 */
export class DateUtils {
  /**
   * Configuration des formats de date en français
   */
  private static readonly DATE_FORMATS: Record<DateFormat, Intl.DateTimeFormatOptions> = {
    short: {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    },
    long: {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    },
    compact: {
      day: '2-digit',
      month: 'short',
    },
  };

  /**
   * Formate une date selon le format spécifié
   * @param date Date à formater (Date ou string)
   * @param format Format d'affichage souhaité
   * @returns Date formatée en français
   */
  static formatDate(date: Date | string, format: DateFormat = 'short'): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('fr-FR', this.DATE_FORMATS[format]);
  }

  /**
   * Parse la date et l'heure d'un match en objet Date
   * @param match Match dont on veut extraire la date
   * @returns Date complète du match
   */
  static parseMatchDateTime(match: Match): Date {
    // Si match.date est au format ISO complet (avec T), extraire juste la partie date
    const dateOnly = match.date.split('T')[0];

    // Construire la date/heure complète
    const dateTimeString = match.heure ? `${dateOnly}T${match.heure}` : match.date;
    return new Date(dateTimeString);
  }

  /**
   * Trie une liste de matchs par date
   * @param matches Liste des matchs à trier
   * @param ascending true pour ordre croissant, false pour décroissant
   * @returns Nouvelle liste triée (non mutée)
   */
  static sortMatchesByDate(matches: Match[], ascending = true): Match[] {
    return [...matches].sort((a, b) => {
      const dateA = this.parseMatchDateTime(a).getTime();
      const dateB = this.parseMatchDateTime(b).getTime();
      return ascending ? dateA - dateB : dateB - dateA;
    });
  }

  /**
   * Compare deux matchs par leur date
   * @param a Premier match
   * @param b Deuxième match
   * @returns Nombre négatif si a < b, positif si a > b, 0 si égal
   */
  static compareMatchDates(a: Match, b: Match): number {
    const dateA = this.parseMatchDateTime(a).getTime();
    const dateB = this.parseMatchDateTime(b).getTime();
    return dateA - dateB;
  }
}
