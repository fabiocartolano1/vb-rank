import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../services/data.service';
import { Match } from '../../models/match.model';
import { Equipe } from '../../models/equipe.model';

@Component({
  selector: 'app-matchs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './matchs.component.html',
  styleUrl: './matchs.component.css'
})
export class MatchsComponent implements OnInit {
  private dataService = inject(DataService);

  matchs = signal<Match[]>([]);
  equipes = signal<Equipe[]>([]);
  loading = signal(true);
  error = signal('');
  openJournees = signal<Set<number>>(new Set());

  ngOnInit() {
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
        this.matchs.set(data);
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

  getMatchsByJournee() {
    const matchsByJournee = new Map<number, Match[]>();
    this.matchs().forEach(match => {
      if (!matchsByJournee.has(match.journee)) {
        matchsByJournee.set(match.journee, []);
      }
      matchsByJournee.get(match.journee)?.push(match);
    });

    // Trier les matchs par date dans chaque journée
    matchsByJournee.forEach((matchs) => {
      matchs.sort((a, b) => {
        const dateA = new Date(a.date + (a.heure ? 'T' + a.heure : '')).getTime();
        const dateB = new Date(b.date + (b.heure ? 'T' + b.heure : '')).getTime();
        return dateA - dateB;
      });
    });

    // Trier les journées par numéro
    return Array.from(matchsByJournee.entries()).sort((a, b) => a[0] - b[0]);
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
}
