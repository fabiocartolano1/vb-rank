import { Component, inject, OnInit, signal, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../services/data.service';
import { EquipeFilterService } from '../../services/equipe-filter.service';
import { Match } from '../../models/match.model';
import { Equipe } from '../../models/equipe.model';
import { MatchCardComponent } from '../../components/match-card/match-card.component';
import { ChampionnatDropdownComponent } from '../../components/championnat-dropdown/championnat-dropdown';
import { ChampionshipService } from '../../core/services/championship.service';
import { TeamUtils } from '../../core/utils/team.utils';
import { DateUtils } from '../../core/utils/date.utils';
import { MatchUtils } from '../../core/utils/match.utils';

@Component({
  selector: 'app-matchs',
  standalone: true,
  imports: [CommonModule, MatchCardComponent, ChampionnatDropdownComponent],
  templateUrl: './matchs.component.html',
  styleUrl: './matchs.component.css',
})
export class MatchsComponent implements OnInit {
  private dataService = inject(DataService);
  private equipeFilterService = inject(EquipeFilterService);
  private championshipService = inject(ChampionshipService);

  allMatchs = signal<Match[]>([]);
  allEquipes = signal<Equipe[]>([]);
  loading = signal(true);
  error = signal('');
  openJournees = signal<Set<number>>(new Set());

  readonly championnats = this.championshipService.getChampionships();

  // Signal pour le championnat sélectionné
  selectedChampionnatId = this.equipeFilterService.getSelectedChampionnatIdSignal();

  // Computed signals pour filtrer par championnat
  matchs = computed(() => {
    const championnatId = this.selectedChampionnatId();
    const all = this.allMatchs();
    return all.filter((match) => match.championnatId === championnatId);
  });

  equipes = computed(() => {
    const championnatId = this.selectedChampionnatId();
    const all = this.allEquipes();
    return all.filter((equipe) => equipe.championnatId === championnatId);
  });

  constructor() {
    // Réagir aux changements de matchs (qui changent quand le championnat change)
    effect(() => {
      const currentMatchs = this.matchs();
      // Ouvrir automatiquement la prochaine journée quand les matchs changent
      if (currentMatchs.length > 0) {
        this.openNextJournee();
        // Scroller vers la journée ouverte après un court délai
        setTimeout(() => {
          this.scrollToOpenJournee();
        }, 200);
      }
    });
  }

  ngOnInit() {
    this.loadData();
  }

  private loadData() {
    this.loading.set(true);
    this.error.set('');

    // Charger toutes les équipes
    this.dataService.getEquipes().subscribe({
      next: (data) => {
        this.allEquipes.set(data);
      },
      error: (err) => {
        console.error('Erreur lors du chargement des équipes:', err);
      },
    });

    // Charger tous les matchs
    this.dataService.getMatchs().subscribe({
      next: (data) => {
        this.allMatchs.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Erreur lors du chargement des matchs');
        this.loading.set(false);
        console.error(err);
      },
    });
  }

  getTeamLogo(teamName: string): string {
    return TeamUtils.getTeamLogo(teamName, this.equipes());
  }

  getMatchsByJournee() {
    // Filtrer les matchs valides et les grouper par journée
    const validMatches = MatchUtils.filterValidMatches(this.matchs());
    return MatchUtils.getJourneesSorted(validMatches);
  }

  formatDate(dateString: string): string {
    return DateUtils.formatDate(dateString, 'short');
  }

  toggleJournee(journeeNumber: number) {
    const currentOpen = new Set(this.openJournees());
    if (currentOpen.has(journeeNumber)) {
      // Si la journée est déjà ouverte, on la ferme
      currentOpen.delete(journeeNumber);
      this.openJournees.set(currentOpen);
    } else {
      // Sinon, on ferme toutes les autres et on ouvre uniquement celle-ci
      this.openJournees.set(new Set([journeeNumber]));

      // Scroller vers la journée après un court délai pour laisser le DOM se mettre à jour
      setTimeout(() => {
        this.scrollToOpenJournee();
      }, 100);
    }
  }

  isJourneeOpen(journeeNumber: number): boolean {
    return this.openJournees().has(journeeNumber);
  }

  isCresMatch(match: Match): boolean {
    return TeamUtils.isCresMatch(match);
  }

  private openNextJournee() {
    const nextJournee = MatchUtils.findNextJournee(this.matchs());
    if (nextJournee) {
      this.openJournees.set(new Set([nextJournee]));
    }
  }

  private scrollToOpenJournee() {
    const openJournees = this.openJournees();
    if (openJournees.size === 0) return;

    // Récupérer la première journée ouverte
    const firstOpenJournee = Array.from(openJournees)[0];
    const element = document.getElementById(`journee-${firstOpenJournee}`);

    if (element) {
      // Calculer l'offset pour positionner l'élément en haut avec un peu de marge
      const offset = 100; // Marge en pixels depuis le haut
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  }

  onChampionnatChange(championnatId: string) {
    this.equipeFilterService.setSelectedChampionnatId(championnatId);
  }
}
