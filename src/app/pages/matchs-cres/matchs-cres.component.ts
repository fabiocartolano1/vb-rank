import { Component, inject, OnInit, signal, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../services/data.service';
import { EquipeFilterService } from '../../services/equipe-filter.service';
import { Match } from '../../models/match.model';
import { Equipe } from '../../models/equipe.model';
import { MatchCardComponent } from '../../components/match-card/match-card.component';

@Component({
  selector: 'app-matchs-cres',
  standalone: true,
  imports: [CommonModule, MatchCardComponent],
  templateUrl: './matchs-cres.component.html',
  styleUrl: './matchs-cres.component.css',
})
export class MatchsCresComponent implements OnInit {
  private dataService = inject(DataService);
  private equipeFilterService = inject(EquipeFilterService);

  allMatchs = signal<Match[]>([]);
  allEquipes = signal<Equipe[]>([]);
  loading = signal(true);
  error = signal('');
  openJournees = signal<Set<number>>(new Set());

  // Signal pour le championnat sélectionné
  selectedChampionnatId = this.equipeFilterService.getSelectedChampionnatIdSignal();

  // Computed signals pour filtrer par championnat ET par équipe du Crès
  matchs = computed(() => {
    const championnatId = this.selectedChampionnatId();
    const all = this.allMatchs();
    return all.filter(
      (match) =>
        match.championnatId === championnatId &&
        (match.equipeDomicile.toLowerCase().includes('crès') ||
          match.equipeExterieur.toLowerCase().includes('crès') ||
          match.equipeDomicile.toLowerCase().includes('cres') ||
          match.equipeExterieur.toLowerCase().includes('cres'))
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
    const equipe = this.equipes().find((e) => e.nom === teamName);
    return (
      equipe?.logoUrl || 'https://ui-avatars.com/api/?name=VB&background=667eea&color=fff&size=128'
    );
  }

  getSortedMatchs() {
    // Trier tous les matchs par date
    return [...this.matchs()].sort((a, b) => {
      const dateA = new Date(a.date + (a.heure ? 'T' + a.heure : '')).getTime();
      const dateB = new Date(b.date + (b.heure ? 'T' + b.heure : '')).getTime();
      return dateA - dateB;
    });
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
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
    return (
      match.equipeDomicile.toLowerCase().includes('crès') ||
      match.equipeExterieur.toLowerCase().includes('crès')
    );
  }
}
