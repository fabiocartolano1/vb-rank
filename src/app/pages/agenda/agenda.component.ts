import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../services/data.service';
import { Match } from '../../models/match.model';
import { Equipe } from '../../models/equipe.model';
import { ChampionshipService } from '../../core/services/championship.service';
import { TeamUtils } from '../../core/utils/team.utils';
import { DateUtils } from '../../core/utils/date.utils';
import { MatchUtils } from '../../core/utils/match.utils';

interface WeekendMatch {
  match: Match;
  equipe?: Equipe;
  adversaire?: Equipe;
  isCresHome: boolean;
}

@Component({
  selector: 'app-agenda',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './agenda.component.html',
  styleUrl: './agenda.component.css',
})
export class AgendaComponent implements OnInit {
  private dataService = inject(DataService);
  private championshipService = inject(ChampionshipService);

  allMatchs = signal<Match[]>([]);
  allEquipes = signal<Equipe[]>([]);
  loading = signal(true);
  error = signal('');
  currentWeekendIndex = signal(0);

  // Tous les weekends disponibles
  weekends = computed(() => {
    const matchs = this.allMatchs();

    if (matchs.length === 0) {
      return [];
    }

    // Trouver la plage de dates de tous les matchs (pas seulement ceux à domicile)
    const dates = matchs
      .filter((match) => MatchUtils.isValidMatch(match))
      .map((match) => new Date(match.date));

    if (dates.length === 0) {
      return [];
    }

    const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));

    // Générer tous les weekends entre la première et la dernière date
    const weekends: Date[] = [];
    let currentSaturday = this.getSaturday(minDate);

    // Reculer au samedi précédent si nécessaire
    while (currentSaturday > minDate) {
      currentSaturday.setDate(currentSaturday.getDate() - 7);
    }

    // Générer tous les weekends jusqu'à la date max
    while (currentSaturday <= maxDate) {
      weekends.push(new Date(currentSaturday));
      currentSaturday.setDate(currentSaturday.getDate() + 7);
    }

    return weekends;
  });

  // Weekend actuellement affiché
  currentWeekend = computed(() => {
    const weekends = this.weekends();
    const index = this.currentWeekendIndex();
    return weekends[index] || new Date();
  });

  // Dimanche du weekend actuel
  currentSunday = computed(() => {
    const saturday = this.currentWeekend();
    const sunday = new Date(saturday);
    sunday.setDate(saturday.getDate() + 1);
    return sunday;
  });

  // Matchs du weekend actuel
  weekendMatchs = computed(() => {
    const saturday = this.currentWeekend();
    const sunday = this.currentSunday();

    return {
      saturday: this.getMatchsForDay(saturday),
      sunday: this.getMatchsForDay(sunday),
    };
  });

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

        // Se positionner sur le prochain weekend
        this.goToNextWeekend();
      },
      error: (err) => {
        this.error.set('Erreur lors du chargement des matchs');
        this.loading.set(false);
        console.error(err);
      },
    });
  }

  private getSaturday(date: Date): Date {
    const day = date.getDay();
    const saturday = new Date(date);

    // Si c'est dimanche (0), reculer d'un jour pour avoir samedi
    if (day === 0) {
      saturday.setDate(date.getDate() - 1);
    }
    // Si c'est un autre jour que samedi (6), calculer le samedi
    else if (day !== 6) {
      saturday.setDate(date.getDate() + (6 - day));
    }

    return saturday;
  }

  private getMatchsForDay(day: Date): WeekendMatch[] {
    const dayString = day.toISOString().split('T')[0];
    const equipes = this.allEquipes();

    return this.allMatchs()
      .filter((match) => {
        const matchDateOnly = match.date.split('T')[0];
        // Filtrer uniquement les matchs valides à domicile de l'équipe principale
        return matchDateOnly === dayString &&
               MatchUtils.isValidMatch(match) &&
               TeamUtils.isCresHome(match);
      })
      .map((match) => {
        const isCresHome = true; // Toujours à domicile maintenant

        const cresEquipe = equipes.find((e) => e.id === match.equipeDomicileId);

        const adversaire = equipes.find((e) => e.id === match.equipeExterieurId);

        return {
          match,
          equipe: cresEquipe,
          adversaire,
          isCresHome,
        };
      })
      .sort((a, b) => {
        const timeA = a.match.heure || '00:00';
        const timeB = b.match.heure || '00:00';
        return timeA.localeCompare(timeB);
      });
  }

  previousWeekend() {
    const current = this.currentWeekendIndex();
    if (current > 0) {
      this.currentWeekendIndex.set(current - 1);
    }
  }

  nextWeekend() {
    const current = this.currentWeekendIndex();
    const max = this.weekends().length - 1;
    if (current < max) {
      this.currentWeekendIndex.set(current + 1);
    }
  }

  private goToNextWeekend() {
    const weekends = this.weekends();
    const now = new Date();

    // Trouver le premier weekend >= aujourd'hui
    const nextIndex = weekends.findIndex((weekend) => {
      const sunday = new Date(weekend);
      sunday.setDate(weekend.getDate() + 1);
      return sunday >= now;
    });

    if (nextIndex !== -1) {
      this.currentWeekendIndex.set(nextIndex);
    } else if (weekends.length > 0) {
      // Si tous les weekends sont passés, afficher le dernier
      this.currentWeekendIndex.set(weekends.length - 1);
    }
  }

  formatDate(date: Date): string {
    return DateUtils.formatDate(date, 'long');
  }

  formatShortDate(date: Date): string {
    return DateUtils.formatDate(date, 'compact');
  }

  getChampionnatLabel(championnatId?: string): string {
    if (!championnatId) return '';
    return this.championshipService.getChampionshipName(championnatId);
  }

  getChampionnatFullName(championnatId?: string): string {
    if (!championnatId) return '';
    return this.championshipService.getChampionshipName(championnatId);
  }

  canGoPrevious(): boolean {
    return this.currentWeekendIndex() > 0;
  }

  canGoNext(): boolean {
    return this.currentWeekendIndex() < this.weekends().length - 1;
  }

  isMatchWon(match: Match): boolean {
    // Le Crès est toujours à domicile maintenant
    return (
      match.statut === 'termine' &&
      match.scoreDomicile !== undefined &&
      match.scoreExterieur !== undefined &&
      match.scoreDomicile > match.scoreExterieur
    );
  }

  isMatchLost(match: Match): boolean {
    // Le Crès est toujours à domicile maintenant
    return (
      match.statut === 'termine' &&
      match.scoreDomicile !== undefined &&
      match.scoreExterieur !== undefined &&
      match.scoreDomicile < match.scoreExterieur
    );
  }
}
