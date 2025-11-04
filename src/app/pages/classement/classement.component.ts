import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../services/data.service';
import { Equipe } from '../../models/equipe.model';
import { EquipeFilterService } from '../../services/equipe-filter.service';
import { ChampionnatDropdownComponent } from '../../components/championnat-dropdown/championnat-dropdown';

@Component({
  selector: 'app-classement',
  standalone: true,
  imports: [CommonModule, ChampionnatDropdownComponent],
  templateUrl: './classement.component.html',
  styleUrl: './classement.component.css',
})
export class ClassementComponent implements OnInit {
  private dataService = inject(DataService);
  private equipeFilterService = inject(EquipeFilterService);

  allEquipes = signal<Equipe[]>([]);
  loading = signal(true);
  error = signal('');

  // Liste des championnats disponibles
  readonly championnats = [
    // Adultes
    { label: 'Nationale 3 F', value: 'Nationale 3 F' },
    { label: 'Prénationale M', value: 'Pré-nationale M' },
    { label: 'Prénationale F', value: 'Pré-nationale F' },
    { label: 'Régionale 2 M', value: 'Régionale 2 M' },
    { label: 'Régionale 2 F', value: 'Régionale 2 F' },
    // Jeunes
    { label: 'M18 M', value: 'm18-m' },
    { label: 'Benjamines', value: 'bfc' },
    { label: 'Benjamins', value: 'bmb' },
    { label: 'Minimes F', value: 'mfd' },
    { label: 'Minimes M', value: 'mmb' },
    { label: 'Cadettes', value: 'cfd' },
  ];

  // Signal pour le championnat sélectionné
  selectedChampionnatId = this.equipeFilterService.getSelectedChampionnatIdSignal();
  selectedEquipe = this.equipeFilterService.getSelectedEquipeSignal();

  // Computed signal pour filtrer les équipes par championnat
  equipes = computed(() => {
    const championnatId = this.selectedChampionnatId();
    const all = this.allEquipes();
    return all.filter((equipe) => equipe.championnatId === championnatId);
  });

  ngOnInit() {
    // Charger toutes les équipes (qui contiennent maintenant les données de classement)
    this.dataService.getEquipes().subscribe({
      next: (data) => {
        this.allEquipes.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Erreur lors du chargement du classement');
        this.loading.set(false);
        console.error(err);
      },
    });
  }

  getTeamLogo(equipe: Equipe): string {
    return (
      equipe.logoUrl || 'https://ui-avatars.com/api/?name=VB&background=667eea&color=fff&size=128'
    );
  }

  getRankClass(rang: number): string {
    if (rang === 1) return 'gold';
    if (rang === 2) return 'silver';
    if (rang === 3) return 'bronze';
    return '';
  }

  getDifference(setsPour: number, setsContre: number): number {
    return setsPour - setsContre;
  }

  isCresTeam(nomEquipe: string): boolean {
    return nomEquipe.toLowerCase().includes('crès') || nomEquipe.toLowerCase().includes('cres');
  }

  onChampionnatChange(equipe: string) {
    this.equipeFilterService.setSelectedEquipe(equipe);
  }
}
