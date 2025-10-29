import { Component, inject, OnInit, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../services/data.service';
import { EquipeFilterService } from '../../services/equipe-filter.service';
import { Match } from '../../models/match.model';
import { Equipe } from '../../models/equipe.model';

@Component({
  selector: 'app-matchs-cres',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './matchs-cres.component.html',
  styleUrl: './matchs-cres.component.css'
})
export class MatchsCresComponent implements OnInit {
  private dataService = inject(DataService);
  private equipeFilterService = inject(EquipeFilterService);

  matchs = signal<Match[]>([]);
  equipes = signal<Equipe[]>([]);
  loading = signal(true);
  error = signal('');
  openJournees = signal<Set<number>>(new Set());

  constructor() {
    // Réagir aux changements d'équipe
    effect(() => {
      const selectedEquipe = this.equipeFilterService.getSelectedEquipeSignal()();
      this.loadData();
    });
  }

  ngOnInit() {
    this.loadData();
  }

  private loadData() {
    this.loading.set(true);
    this.error.set('');

    // Vérifier si on doit afficher des données
    if (!this.equipeFilterService.shouldShowData()) {
      this.matchs.set([]);
      this.equipes.set([]);
      this.loading.set(false);
      return;
    }

    // Charger les équipes et les matchs
    this.dataService.getEquipes().subscribe({
      next: (data) => {
        this.equipes.set(data);
      },
      error: (err) => {
        console.error('Erreur lors du chargement des équipes:', err);
      }
    });

    this.dataService.getMatchs().subscribe({
      next: (data) => {
        // Filtrer uniquement les matchs du Crès
        const cresMatchs = data.filter(match =>
          match.equipeDomicile.toLowerCase().includes('crès') ||
          match.equipeExterieur.toLowerCase().includes('crès')
        );
        this.matchs.set(cresMatchs);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Erreur lors du chargement des matchs');
        this.loading.set(false);
        console.error(err);
      }
    });
  }

  getTeamLogo(teamName: string): string {
    const equipe = this.equipes().find(e => e.nom === teamName);
    return equipe?.logoUrl || 'https://ui-avatars.com/api/?name=VB&background=667eea&color=fff&size=128';
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
      year: 'numeric'
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
    return match.equipeDomicile.toLowerCase().includes('crès') ||
           match.equipeExterieur.toLowerCase().includes('crès');
  }
}
