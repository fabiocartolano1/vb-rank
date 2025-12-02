import { Equipe } from '../../models/equipe.model';
import { Match } from '../../models/match.model';
import { ASSETS, CRES_KEYWORDS } from '../constants/assets.constants';

/**
 * Utilitaires pour la gestion des équipes
 */
export class TeamUtils {
  /**
   * Mots-clés pour identifier l'équipe principale
   * Peut être défini dynamiquement depuis la configuration
   */
  private static mainTeamKeywords: string[] = [...CRES_KEYWORDS];

  /**
   * Définit les mots-clés de l'équipe principale
   * @param keywords Liste de mots-clés pour identifier l'équipe
   */
  static setMainTeamKeywords(keywords: string[]): void {
    this.mainTeamKeywords = keywords;
  }

  /**
   * Vérifie si une équipe est l'équipe principale
   * @param teamName Nom de l'équipe
   * @returns true si l'équipe est l'équipe principale
   */
  static isMainTeam(teamName: string): boolean {
    const normalized = teamName.toLowerCase();
    return this.mainTeamKeywords.some(keyword => normalized.includes(keyword.toLowerCase()));
  }

  /**
   * Vérifie si un match implique l'équipe principale
   * @param match Match à vérifier
   * @returns true si le match implique l'équipe principale
   */
  static isMainMatch(match: Match): boolean {
    return this.isMainTeam(match.equipeDomicile) || this.isMainTeam(match.equipeExterieur);
  }

  /**
   * Vérifie si l'équipe principale joue à domicile
   * @param match Match à vérifier
   * @returns true si l'équipe principale joue à domicile
   */
  static isMainHome(match: Match): boolean {
    return this.isMainTeam(match.equipeDomicile);
  }

  // Méthodes legacy pour compatibilité (deprecated)
  /** @deprecated Utilisez isMainTeam() */
  static isCresTeam(teamName: string): boolean {
    return this.isMainTeam(teamName);
  }

  /** @deprecated Utilisez isMainMatch() */
  static isCresMatch(match: Match): boolean {
    return this.isMainMatch(match);
  }

  /** @deprecated Utilisez isMainHome() */
  static isCresHome(match: Match): boolean {
    return this.isMainHome(match);
  }

  /**
   * Récupère le logo d'une équipe par son nom
   * @param teamName Nom de l'équipe
   * @param equipes Liste des équipes disponibles
   * @returns URL du logo de l'équipe ou logo par défaut
   */
  static getTeamLogo(teamName: string, equipes: Equipe[]): string {
    const equipe = equipes.find(e => e.nom === teamName);
    return equipe?.logoUrl || ASSETS.DEFAULT_TEAM_LOGO;
  }

  /**
   * Récupère une équipe par son nom
   * @param teamName Nom de l'équipe
   * @param equipes Liste des équipes disponibles
   * @returns L'équipe trouvée ou undefined
   */
  static findTeamByName(teamName: string, equipes: Equipe[]): Equipe | undefined {
    return equipes.find(e => e.nom === teamName);
  }
}
