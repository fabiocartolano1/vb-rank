import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class EquipeFilterService {
  private selectedEquipe = signal('Régionale 2 M');

  getSelectedEquipe() {
    return this.selectedEquipe();
  }

  setSelectedEquipe(equipe: string) {
    this.selectedEquipe.set(equipe);
  }

  // Observable pour que les composants puissent réagir aux changements
  getSelectedEquipeSignal() {
    return this.selectedEquipe.asReadonly();
  }

  // Vérifier si les données doivent être affichées
  shouldShowData(): boolean {
    return this.selectedEquipe() === 'Régionale 2 M';
  }
}
