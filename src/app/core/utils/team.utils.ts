import { Equipe } from '../../models/equipe.model';
import { Match } from '../../models/match.model';
import { ASSETS, CRES_KEYWORDS } from '../constants/assets.constants';

/**
 * Utilitaires pour la gestion des équipes
 */
export class TeamUtils {
  /**
   * Vérifie si une équipe est celle du Crès
   * @param teamName Nom de l'équipe
   * @returns true si l'équipe est celle du Crès
   */
  static isCresTeam(teamName: string): boolean {
    const normalized = teamName.toLowerCase();
    return CRES_KEYWORDS.some(keyword => normalized.includes(keyword));
  }

  /**
   * Vérifie si un match implique l'équipe du Crès
   * @param match Match à vérifier
   * @returns true si le match implique le Crès
   */
  static isCresMatch(match: Match): boolean {
    return this.isCresTeam(match.equipeDomicile) || this.isCresTeam(match.equipeExterieur);
  }

  /**
   * Vérifie si le Crès joue à domicile
   * @param match Match à vérifier
   * @returns true si le Crès joue à domicile
   */
  static isCresHome(match: Match): boolean {
    return this.isCresTeam(match.equipeDomicile);
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
