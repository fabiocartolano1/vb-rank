import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ChampionnatSelectionService {
  // Championnat actuellement sélectionné
  private selectedChampionnatIdSignal = signal<string | null>('regionale-2-m');

  // Getter pour accéder au signal en lecture seule
  selectedChampionnatId = this.selectedChampionnatIdSignal.asReadonly();

  /**
   * Définit le championnat sélectionné
   */
  setSelectedChampionnat(championnatId: string) {
    this.selectedChampionnatIdSignal.set(championnatId);
  }

  /**
   * Récupère l'ID du championnat sélectionné
   */
  getSelectedChampionnatId(): string | null {
    return this.selectedChampionnatIdSignal();
  }
}
