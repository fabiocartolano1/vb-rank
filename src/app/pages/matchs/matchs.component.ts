import { Component, inject, OnInit, signal, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../services/data.service';
import { EquipeFilterService } from '../../services/equipe-filter.service';
import { Match } from '../../models/match.model';
import { Equipe } from '../../models/equipe.model';
import { MatchCardComponent } from '../../components/match-card/match-card.component';
import { ChampionnatDropdownComponent } from '../../components/championnat-dropdown/championnat-dropdown';
import { ToggleButtonComponent } from '../../components/toggle-button/toggle-button.component';
import { ChampionshipService } from '../../core/services/championship.service';
import { TeamUtils } from '../../core/utils/team.utils';
import { DateUtils } from '../../core/utils/date.utils';
import { MatchUtils } from '../../core/utils/match.utils';

@Component({
  selector: 'app-matchs',
  standalone: true,
  imports: [CommonModule, MatchCardComponent, ChampionnatDropdownComponent, ToggleButtonComponent],
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
  showAllMatches = signal(true); // false = tous les matchs, true = nos matchs uniquement

  readonly championnats = this.championshipService.getChampionships();

  // Signal pour le championnat sélectionné
  selectedChampionnatId = this.equipeFilterService.getSelectedChampionnatIdSignal();

  // Computed signals pour filtrer par championnat
  matchs = computed(() => {
    const championnatId = this.selectedChampionnatId();
    const all = this.allMatchs();
    const filteredByChampionnat = all.filter((match) => match.championnatId === championnatId);

    // En mode "nos matchs" (toggle activé), filtrer uniquement les matchs CRES
    if (this.showAllMatches()) {
      return filteredByChampionnat.filter((match) => TeamUtils.isCresMatch(match));
    }

    return filteredByChampionnat;
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

  getSortedMatchs() {
    const validMatches = MatchUtils.filterValidMatches(this.matchs());
    return DateUtils.sortMatchesByDate(validMatches);
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

  toggleMatchView() {
    this.showAllMatches.set(!this.showAllMatches());
    // Rouvrir la prochaine journée quand on change de vue
    setTimeout(() => {
      this.openNextJournee();
      setTimeout(() => {
        this.scrollToOpenJournee();
      }, 100);
    }, 50);
  }

  getCresWin(match: Match): boolean | null {
    // Si le match n'est pas terminé, retourner null
    if (match.statut !== 'termine' ||
        match.scoreDomicile === null ||
        match.scoreDomicile === undefined ||
        match.scoreExterieur === null ||
        match.scoreExterieur === undefined) {
      return null;
    }

    const isCresHome = TeamUtils.isCresTeam(match.equipeDomicile);
    const isCresAway = TeamUtils.isCresTeam(match.equipeExterieur);

    // Si CRES est à domicile
    if (isCresHome) {
      return match.scoreDomicile > match.scoreExterieur;
    }

    // Si CRES est à l'extérieur
    if (isCresAway) {
      return match.scoreExterieur > match.scoreDomicile;
    }

    // Cas où ce n'est pas un match du CRES (ne devrait pas arriver)
    return null;
  }
}
