import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../services/data.service';
import { Classement } from '../../models/classement.model';

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
  loading = signal(true);
  error = signal('');

  ngOnInit() {
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
