import { Injectable } from '@angular/core';
import { CHAMPIONSHIPS, ADULT_CHAMPIONSHIPS, Championship } from '../constants/championships.constants';

/**
 * Service de gestion des championnats
 * Fournit un accès centralisé aux données des championnats et des méthodes utilitaires
 */
@Injectable({
  providedIn: 'root'
})
export class ChampionshipService {

  /**
   * Retourne la liste complète des championnats
   */
  getChampionships(): readonly Championship[] {
    return CHAMPIONSHIPS;
  }

  /**
   * Retourne la liste des championnats adultes uniquement
   */
  getAdultChampionships(): readonly Championship[] {
    return ADULT_CHAMPIONSHIPS;
  }

  /**
   * Retourne un championnat par son ID
   */
  getChampionshipById(id: string): Championship | undefined {
    return CHAMPIONSHIPS.find(c => c.id === id);
  }

  /**
   * Retourne le nom d'un championnat par son ID
   */
  getChampionshipName(id: string): string {
    const championship = this.getChampionshipById(id);
    return championship?.name || id;
  }
}
