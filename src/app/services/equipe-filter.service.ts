import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class EquipeFilterService {
  // Mapping entre les noms affichés et les IDs des championnats
  private championnatMapping: { [key: string]: string } = {
    'Régionale 2 M': 'regionale-2-m',
    'Régionale 2 F': 'regionale-2-f',
    'Pré-nationale M': 'pre-nationale-m',
    'Pré-nationale F': 'pre-nationale-f',
    'Nationale 3 F': 'nationale-3-f'
  };

  private selectedEquipe = signal('Régionale 2 M');
  private selectedChampionnatId = signal('regionale-2-m');

  getSelectedEquipe() {
    return this.selectedEquipe();
  }

  setSelectedEquipe(equipe: string) {
    this.selectedEquipe.set(equipe);
    // Mettre à jour l'ID du championnat correspondant
    const championnatId = this.championnatMapping[equipe];
    if (championnatId) {
      this.selectedChampionnatId.set(championnatId);
    }
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
