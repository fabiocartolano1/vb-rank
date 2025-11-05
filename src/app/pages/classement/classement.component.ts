import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../services/data.service';
import { Equipe } from '../../models/equipe.model';
import { EquipeFilterService } from '../../services/equipe-filter.service';
import { ChampionnatDropdownComponent } from '../../components/championnat-dropdown/championnat-dropdown';
import { ChampionshipService } from '../../core/services/championship.service';
import { TeamUtils } from '../../core/utils/team.utils';
import { ASSETS } from '../../core/constants/assets.constants';

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
  private championshipService = inject(ChampionshipService);

  allEquipes = signal<Equipe[]>([]);
  loading = signal(true);
  error = signal('');

  // Liste des championnats disponibles
  readonly championnats = this.championshipService.getChampionships();

  // Signal pour le championnat sélectionné
  selectedChampionnatId = this.equipeFilterService.getSelectedChampionnatIdSignal();

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
    return equipe.logoUrl || ASSETS.DEFAULT_TEAM_LOGO;
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
    return TeamUtils.isCresTeam(nomEquipe);
  }

  onChampionnatChange(championnatId: string) {
    this.equipeFilterService.setSelectedChampionnatId(championnatId);
  }
}
