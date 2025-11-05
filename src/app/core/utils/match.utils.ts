import { Match } from '../../models/match.model';
import { PLACEHOLDER_TEAM } from '../constants/assets.constants';
import { DateUtils } from './date.utils';

/**
 * Utilitaires pour la gestion des matchs
 */
export class MatchUtils {
  /**
   * Vérifie si un match est valide (pas un match placeholder avec "xxx")
   * @param match Match à vérifier
   * @returns true si le match est valide
   */
  static isValidMatch(match: Match): boolean {
    const placeholder = PLACEHOLDER_TEAM;
    return (
      !match.equipeDomicile.toLowerCase().includes(placeholder) &&
      !match.equipeExterieur.toLowerCase().includes(placeholder)
    );
  }

  /**
   * Filtre une liste de matchs pour ne garder que les matchs valides
   * @param matches Liste des matchs
   * @returns Liste filtrée des matchs valides
   */
  static filterValidMatches(matches: Match[]): Match[] {
    return matches.filter(match => this.isValidMatch(match));
  }

  /**
   * Groupe les matchs par numéro de journée
   * @param matches Liste des matchs à grouper
   * @returns Map associant chaque numéro de journée à ses matchs (triés par date)
   */
  static groupByJournee(matches: Match[]): Map<number, Match[]> {
    const grouped = new Map<number, Match[]>();

    matches.forEach(match => {
      if (!grouped.has(match.journee)) {
        grouped.set(match.journee, []);
      }
      grouped.get(match.journee)!.push(match);
    });

    // Trier les matchs par date dans chaque journée
    grouped.forEach(journeeMatches => {
      journeeMatches.sort((a, b) => DateUtils.compareMatchDates(a, b));
    });

    return grouped;
  }

  /**
   * Récupère les journées triées avec leurs matchs
   * @param matches Liste des matchs
   * @returns Tableau [numéro de journée, matchs[]] trié par numéro de journée
   */
  static getJourneesSorted(matches: Match[]): [number, Match[]][] {
    const grouped = this.groupByJournee(matches);
    return Array.from(grouped.entries()).sort((a, b) => a[0] - b[0]);
  }

  /**
   * Groupe les matchs par week-end
   * @param matches Liste des matchs
   * @returns Map associant chaque date de week-end à ses matchs
   */
  static groupByWeekend(matches: Match[]): Map<string, Match[]> {
    const grouped = new Map<string, Match[]>();

    matches.forEach(match => {
      const date = new Date(match.date);
      // Utiliser le samedi du week-end comme clé
      const dayOfWeek = date.getDay();
      const daysToSaturday = dayOfWeek === 0 ? -1 : 6 - dayOfWeek;
      const saturday = new Date(date);
      saturday.setDate(date.getDate() + daysToSaturday);
      const key = saturday.toISOString().split('T')[0];

      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(match);
    });

    return grouped;
  }

  /**
   * Trouve le prochain match à venir
   * @param matches Liste des matchs
   * @returns Le prochain match ou undefined si aucun match à venir
   */
  static findNextMatch(matches: Match[]): Match | undefined {
    const now = new Date();
    const futureMatches = matches
      .filter(match => DateUtils.parseMatchDateTime(match) >= now)
      .sort((a, b) => DateUtils.compareMatchDates(a, b));

    return futureMatches[0];
  }

  /**
   * Trouve la prochaine journée à venir
   * @param matches Liste des matchs
   * @returns Le numéro de la prochaine journée ou undefined
   */
  static findNextJournee(matches: Match[]): number | undefined {
    const nextMatch = this.findNextMatch(matches);
    return nextMatch?.journee;
  }
}
