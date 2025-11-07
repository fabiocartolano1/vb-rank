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
  selector: 'app-matchs-cres',
  standalone: true,
  imports: [CommonModule, MatchCardComponent, ChampionnatDropdownComponent],
  templateUrl: './matchs-cres.component.html',
  styleUrl: './matchs-cres.component.css',
})
export class MatchsCresComponent implements OnInit {
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

  // Computed signals pour filtrer par championnat ET par équipe du Crès
  matchs = computed(() => {
    const championnatId = this.selectedChampionnatId();
    const all = this.allMatchs();
    return all.filter(
      (match) =>
        match.championnatId === championnatId && TeamUtils.isCresMatch(match)
    );
  });

  equipes = computed(() => {
    const championnatId = this.selectedChampionnatId();
    const all = this.allEquipes();
    return all.filter((equipe) => equipe.championnatId === championnatId);
  });

  constructor() {
    // Réagir aux changements de championnat
    effect(() => {
      const championnatId = this.selectedChampionnatId();
      // Réinitialiser les journées ouvertes quand on change de championnat
      this.openJournees.set(new Set());
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
      currentOpen.delete(journeeNumber);
    } else {
      currentOpen.add(journeeNumber);
    }
    this.openJournees.set(currentOpen);
  }

  isJourneeOpen(journeeNumber: number): boolean {
    return this.openJournees().has(journeeNumber);
  }

  isCresMatch(match: Match): boolean {
    return TeamUtils.isCresMatch(match);
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

  onChampionnatChange(championnatId: string) {
    this.equipeFilterService.setSelectedChampionnatId(championnatId);
  }
}
