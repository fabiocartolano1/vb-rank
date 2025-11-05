import { Component, signal, inject, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { Firestore, collection, getDocs } from '@angular/fire/firestore';
import { CommonModule } from '@angular/common';
import { DataImportService } from './services/data-import.service';
import { DataService } from './services/data.service';
import { EquipeFilterService } from './services/equipe-filter.service';
import { ThemeToggleComponent } from './components/theme-toggle/theme-toggle';
import { ChampionshipService } from './core/services/championship.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, ThemeToggleComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('vb-rank-app');
  protected readonly firebaseStatus = signal('Test de connexion en cours...');
  protected readonly isConnected = signal(false);
  protected readonly importStatus = signal('');
  protected readonly isImporting = signal(false);
  protected readonly cresLogoUrl = signal('');
  protected readonly isAgendaRoute = signal(false);

  private firestore = inject(Firestore);
  private dataImportService = inject(DataImportService);
  private router = inject(Router);
  private dataService = inject(DataService);
  private equipeFilterService = inject(EquipeFilterService);
  private championshipService = inject(ChampionshipService);

  // Liste des championnats adultes (utilisé dans la navigation)
  protected readonly championnats = this.championshipService.getAdultChampionships();
  protected readonly selectedChampionnatId = this.equipeFilterService.getSelectedChampionnatIdSignal();

  async ngOnInit() {
    // Suivre les changements de route pour cacher le sélecteur d'équipe sur la page agenda
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.isAgendaRoute.set(this.router.url === '/agenda');
    });

    // Vérifier la route initiale
    this.isAgendaRoute.set(this.router.url === '/agenda');
    // Charger le logo du Crès
    this.dataService.getEquipes().subscribe({
      next: (equipes) => {
        const cresEquipe = equipes.find(e => e.nom.toLowerCase().includes('crès'));
        if (cresEquipe && cresEquipe.logoUrl) {
          this.cresLogoUrl.set(cresEquipe.logoUrl);
        }
      },
      error: (err) => {
        console.error('Erreur lors du chargement des équipes:', err);
      }
    });
    try {
      // Test de connexion en essayant d'accéder à Firestore
      const testCollection = collection(this.firestore, 'test');
      await getDocs(testCollection);

      this.firebaseStatus.set('✓ Connexion à Firebase réussie !');
      this.isConnected.set(true);
      console.log('Firebase connecté avec succès');
    } catch (error) {
      this.firebaseStatus.set('✗ Erreur de connexion à Firebase');
      this.isConnected.set(false);
      console.error('Erreur de connexion Firebase:', error);
    }
  }

  onChampionnatChange(championnatId: string) {
    this.equipeFilterService.setSelectedChampionnatId(championnatId);
  }

  async importData() {
    this.isImporting.set(true);
    this.importStatus.set('Importation en cours...');

    try {
      const result = await this.dataImportService.importAllData();
      this.importStatus.set(
        `✓ Importation réussie ! ${result.equipes} équipes (avec classement), ${result.matchs} matchs`
      );
    } catch (error) {
      this.importStatus.set('✗ Erreur lors de l\'importation');
      console.error('Erreur:', error);
    } finally {
      this.isImporting.set(false);
    }
  }
}
