import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../services/data.service';
import { Match } from '../../models/match.model';

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
  loading = signal(true);
  error = signal('');

  ngOnInit() {
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
}
