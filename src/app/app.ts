import { Component, signal, inject, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { Firestore, collection, getDocs } from '@angular/fire/firestore';
import { CommonModule } from '@angular/common';
import { DataImportService } from './services/data-import.service';
import { DataService } from './services/data.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('vb-rank-app');
  protected readonly subtitle = signal('Championnat RM2 - Occitanie Est 2025/2026');
  protected readonly firebaseStatus = signal('Test de connexion en cours...');
  protected readonly isConnected = signal(false);
  protected readonly importStatus = signal('');
  protected readonly isImporting = signal(false);
  protected readonly cresLogoUrl = signal('');

  private firestore = inject(Firestore);
  private dataImportService = inject(DataImportService);
  private router = inject(Router);
  private dataService = inject(DataService);

  async ngOnInit() {
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

    // Mettre à jour le sous-titre selon la route active
    this.updateSubtitle(this.router.url);

    // Écouter les changements de route
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.updateSubtitle(event.urlAfterRedirects);
      });
  }

  private updateSubtitle(url: string) {
    if (url.includes('/classement')) {
      this.subtitle.set('Classement - Championnat RM2 - Occitanie Est 2025/2026');
    } else if (url.includes('/matchs-cres')) {
      this.subtitle.set('Nos Matchs - Championnat RM2 - Occitanie Est 2025/2026');
    } else if (url.includes('/matchs')) {
      this.subtitle.set('Tous les Matchs - Championnat RM2 - Occitanie Est 2025/2026');
    } else {
      this.subtitle.set('Championnat RM2 - Occitanie Est 2025/2026');
    }
  }

  async importData() {
    this.isImporting.set(true);
    this.importStatus.set('Importation en cours...');

    try {
      const result = await this.dataImportService.importAllData();
      this.importStatus.set(
        `✓ Importation réussie ! ${result.equipes} équipes, ${result.matchs} matchs, ${result.classement} entrées de classement`
      );
    } catch (error) {
      this.importStatus.set('✗ Erreur lors de l\'importation');
      console.error('Erreur:', error);
    } finally {
      this.isImporting.set(false);
    }
  }
}
