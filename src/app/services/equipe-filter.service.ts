import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class EquipeFilterService {
  private readonly STORAGE_KEY = 'vb-rank-selected-championnat';

  // Mapping entre les noms affichés et les IDs des championnats
  private championnatMapping: { [key: string]: string } = {
    // Adultes
    'Régionale 2 M': 'regionale-2-m',
    'Régionale 2 F': 'regionale-2-f',
    'Pré-nationale M': 'prenationale-m',
    'Pré-nationale F': 'prenationale-f',
    'Nationale 3 F': 'nationale-3-f',
    // Jeunes (ils sont déjà en format ID)
    'm18-m': 'm18-m',
    'bfc': 'bfc',
    'bmb': 'bmb',
    'mfd': 'mfd',
    'mmb': 'mmb',
    'cfd': 'cfd'
  };

  private selectedEquipe = signal(this.loadFromStorage());
  private selectedChampionnatId = signal(this.getInitialChampionnatId());

  private loadFromStorage(): string {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return stored;
      }
    }
    return 'Régionale 2 M'; // Valeur par défaut
  }

  private getInitialChampionnatId(): string {
    const equipe = this.loadFromStorage();
    return this.championnatMapping[equipe] || equipe;
  }

  private saveToStorage(equipe: string): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(this.STORAGE_KEY, equipe);
    }
  }

  getSelectedEquipe() {
    return this.selectedEquipe();
  }

  setSelectedEquipe(equipe: string) {
    this.selectedEquipe.set(equipe);
    // Mettre à jour l'ID du championnat correspondant
    const championnatId = this.championnatMapping[equipe] || equipe;
    this.selectedChampionnatId.set(championnatId);
    // Sauvegarder dans le localStorage
    this.saveToStorage(equipe);
  }

  // Observable pour que les composants puissent réagir aux changements
  getSelectedEquipeSignal() {
    return this.selectedEquipe.asReadonly();
  }

  // Récupérer l'ID du championnat sélectionné
  getSelectedChampionnatId() {
    return this.selectedChampionnatId();
  }

  // Observable pour l'ID du championnat
  getSelectedChampionnatIdSignal() {
    return this.selectedChampionnatId.asReadonly();
  }

  // Vérifier si les données doivent être affichées (pour compatibilité)
  shouldShowData(): boolean {
    return this.selectedEquipe() === 'Régionale 2 M';
  }
}
