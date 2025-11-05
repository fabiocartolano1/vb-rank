import { Injectable, signal } from '@angular/core';
import { CHAMPIONSHIPS } from '../core/constants/championships.constants';

@Injectable({
  providedIn: 'root'
})
export class EquipeFilterService {
  private readonly STORAGE_KEY = 'vb-rank-selected-championnat';
  private readonly DEFAULT_CHAMPIONSHIP_ID = 'regionale-2-m';

  // Signal pour l'ID du championnat sélectionné
  private selectedChampionnatId = signal(this.loadFromStorage());

  private loadFromStorage(): string {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        // Migration: convertir les anciens noms en IDs si nécessaire
        const championship = CHAMPIONSHIPS.find(c => c.name === stored || c.id === stored);
        return championship?.id || this.DEFAULT_CHAMPIONSHIP_ID;
      }
    }
    return this.DEFAULT_CHAMPIONSHIP_ID;
  }

  private saveToStorage(championnatId: string): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(this.STORAGE_KEY, championnatId);
    }
  }

  /**
   * Récupère l'ID du championnat sélectionné
   */
  getSelectedChampionnatId(): string {
    return this.selectedChampionnatId();
  }

  /**
   * Définit le championnat sélectionné par son ID
   */
  setSelectedChampionnatId(championnatId: string): void {
    this.selectedChampionnatId.set(championnatId);
    this.saveToStorage(championnatId);
  }

  /**
   * Signal readonly pour l'ID du championnat sélectionné
   * Les composants peuvent s'abonner à ce signal pour réagir aux changements
   */
  getSelectedChampionnatIdSignal() {
    return this.selectedChampionnatId.asReadonly();
  }

  /**
   * @deprecated Utiliser setSelectedChampionnatId à la place
   * Conservé temporairement pour la compatibilité
   */
  setSelectedEquipe(equipe: string): void {
    // Essayer de trouver le championnat par son nom ou son ID
    const championship = CHAMPIONSHIPS.find(c => c.name === equipe || c.id === equipe);
    if (championship) {
      this.setSelectedChampionnatId(championship.id);
    } else {
      this.setSelectedChampionnatId(equipe);
    }
  }

  /**
   * @deprecated Utiliser getSelectedChampionnatIdSignal à la place
   * Conservé temporairement pour la compatibilité
   */
  getSelectedEquipeSignal() {
    return this.selectedChampionnatId.asReadonly();
  }

  /**
   * @deprecated Cette méthode n'est plus nécessaire
   */
  shouldShowData(): boolean {
    return this.selectedChampionnatId() === this.DEFAULT_CHAMPIONSHIP_ID;
  }
}
