import { Injectable, inject, signal } from '@angular/core';
import { CHAMPIONSHIPS, ADULT_CHAMPIONSHIPS, Championship } from '../constants/championships.constants';
import { DataService } from '../../services/data.service';
import { Championnat } from '../../models/championnat.model';

/**
 * Service de gestion des championnats
 * Fournit un accès centralisé aux données des championnats et des méthodes utilitaires
 * Charge les championnats depuis Firestore
 */
@Injectable({
  providedIn: 'root'
})
export class ChampionshipService {
  private dataService = inject(DataService);

  // Signal contenant les championnats chargés depuis Firestore
  private championshipsSignal = signal<Championship[]>([]);
  private loaded = signal(false);

  constructor() {
    this.loadChampionships();
  }

  /**
   * Charge les championnats depuis Firestore
   */
  private loadChampionships() {
    this.dataService.getChampionnats().subscribe({
      next: (championnats: Championnat[]) => {
        // Convertir les championnats Firestore en format Championship
        let championships: Championship[] = championnats.map(c => ({
          id: c.id || '',
          name: c.nom,
          label: c.label,
          ordre: c.ordre
        }));

        // Trier par ordre si défini, sinon par nom
        championships.sort((a, b) => {
          if (a.ordre !== undefined && b.ordre !== undefined) {
            return a.ordre - b.ordre;
          }
          if (a.ordre !== undefined) return -1;
          if (b.ordre !== undefined) return 1;
          return a.name.localeCompare(b.name);
        });

        this.championshipsSignal.set(championships);
        this.loaded.set(true);
      },
      error: (err: Error) => {
        console.error('Erreur lors du chargement des championnats, utilisation des constantes par défaut', err);
        // En cas d'erreur, utiliser les constantes hardcodées
        this.championshipsSignal.set([...CHAMPIONSHIPS]);
        this.loaded.set(true);
      }
    });
  }

  /**
   * Retourne la liste complète des championnats
   */
  getChampionships(): Championship[] {
    const championships = this.championshipsSignal();
    // Si pas encore chargé, retourner les constantes en attendant
    return championships.length > 0 ? championships : [...CHAMPIONSHIPS];
  }

  /**
   * Retourne un signal des championnats (pour les composants réactifs)
   */
  getChampionshipsSignal() {
    return this.championshipsSignal.asReadonly();
  }

  /**
   * Retourne un signal indiquant si les championnats sont chargés
   */
  isLoaded() {
    return this.loaded.asReadonly();
  }

  /**
   * Retourne la liste des championnats adultes uniquement
   */
  getAdultChampionships(): Championship[] {
    const championships = this.championshipsSignal();
    // Si pas encore chargé, retourner les constantes en attendant
    return championships.length > 0 ? championships.slice(0, 5) : [...ADULT_CHAMPIONSHIPS];
  }

  /**
   * Retourne un championnat par son ID
   */
  getChampionshipById(id: string): Championship | undefined {
    const championships = this.championshipsSignal();
    if (championships.length === 0) {
      return CHAMPIONSHIPS.find(c => c.id === id);
    }
    return championships.find(c => c.id === id);
  }

  /**
   * Retourne le nom d'un championnat par son ID
   */
  getChampionshipName(id: string): string {
    const championship = this.getChampionshipById(id);
    return championship?.name || id;
  }
}
