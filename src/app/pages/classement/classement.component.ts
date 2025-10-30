import { Component, inject, OnInit, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../services/data.service';
import { Equipe } from '../../models/equipe.model';
import { EquipeFilterService } from '../../services/equipe-filter.service';

@Component({
  selector: 'app-classement',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './classement.component.html',
  styleUrl: './classement.component.css'
})
export class ClassementComponent implements OnInit {
  private dataService = inject(DataService);
  private equipeFilterService = inject(EquipeFilterService);

  allEquipes = signal<Equipe[]>([]);
  loading = signal(true);
  error = signal('');

  // Signal pour le championnat sélectionné
  selectedChampionnatId = this.equipeFilterService.getSelectedChampionnatIdSignal();

  // Computed signal pour filtrer les équipes par championnat
  equipes = computed(() => {
    const championnatId = this.selectedChampionnatId();
    const all = this.allEquipes();
    return all.filter(equipe => equipe.championnatId === championnatId);
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
      }
    });
  }

  getTeamLogo(equipe: Equipe): string {
    return equipe.logoUrl || 'https://ui-avatars.com/api/?name=VB&background=667eea&color=fff&size=128';
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
}
