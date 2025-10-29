import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../services/data.service';
import { Classement } from '../../models/classement.model';
import { Equipe } from '../../models/equipe.model';

@Component({
  selector: 'app-classement',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './classement.component.html',
  styleUrl: './classement.component.css'
})
export class ClassementComponent implements OnInit {
  private dataService = inject(DataService);

  classement = signal<Classement[]>([]);
  equipes = signal<Equipe[]>([]);
  loading = signal(true);
  error = signal('');

  ngOnInit() {
    // Charger les équipes et le classement
    this.dataService.getEquipes().subscribe({
      next: (data) => {
        this.equipes.set(data);
      },
      error: (err) => {
        console.error('Erreur lors du chargement des équipes:', err);
      }
    });

    this.dataService.getClassement().subscribe({
      next: (data) => {
        this.classement.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Erreur lors du chargement du classement');
        this.loading.set(false);
        console.error(err);
      }
    });
  }

  getTeamLogo(teamName: string): string {
    const equipe = this.equipes().find(e => e.nom === teamName);
    return equipe?.logoUrl || 'https://ui-avatars.com/api/?name=VB&background=667eea&color=fff&size=128';
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
