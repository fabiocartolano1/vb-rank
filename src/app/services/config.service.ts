import { Injectable, inject, signal } from '@angular/core';
import { Firestore, doc, docData, setDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { TeamUtils } from '../core/utils/team.utils';

export interface NavItem {
  id: string;
  label: string;
  route: string;
  enabled: boolean;
}

export interface NavigationConfig {
  desktop: NavItem[];
  mobile: NavItem[];
}

export interface ClubColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

export interface ClubConfig {
  name: string;
  shortName: string;
  logo: string;
  colors: ClubColors;
  teamKeywords: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private firestore = inject(Firestore);

  navigationConfig = signal<NavigationConfig | null>(null);
  clubConfig = signal<ClubConfig | null>(null);

  constructor() {
    this.loadNavigationConfig();
    this.loadClubConfig();
  }

  private loadNavigationConfig() {
    const configRef = doc(this.firestore, 'config', 'navigation');
    docData(configRef).subscribe({
      next: (data: any) => {
        if (data?.navigation) {
          this.navigationConfig.set(data.navigation);
        }
      },
      error: (error) => {
        console.error('Erreur lors du chargement de la configuration navigation:', error);
        // Utiliser la configuration par défaut
        this.navigationConfig.set(this.getDefaultNavigationConfig());
      }
    });
  }

  private loadClubConfig() {
    const configRef = doc(this.firestore, 'config', 'club');
    docData(configRef).subscribe({
      next: (data: any) => {
        if (data) {
          this.clubConfig.set(data as ClubConfig);
          // Appliquer les couleurs CSS
          this.applyColors(data.colors);
          // Appliquer les mots-clés de l'équipe principale
          TeamUtils.setMainTeamKeywords(data.teamKeywords || []);
        }
      },
      error: (error) => {
        console.error('Erreur lors du chargement de la configuration club:', error);
        // Utiliser la configuration par défaut
        const defaultConfig = this.getDefaultClubConfig();
        this.clubConfig.set(defaultConfig);
        this.applyColors(defaultConfig.colors);
        TeamUtils.setMainTeamKeywords(defaultConfig.teamKeywords);
      }
    });
  }

  private applyColors(colors: ClubColors) {
    const root = document.documentElement;
    root.style.setProperty('--club-primary', colors.primary);
    root.style.setProperty('--club-secondary', colors.secondary);
    root.style.setProperty('--club-accent', colors.accent);
    root.style.setProperty('--club-background', colors.background);
    root.style.setProperty('--club-text', colors.text);

    // Convertir la couleur primaire en RGB pour les rgba()
    const primaryRgb = this.hexToRgb(colors.primary);
    if (primaryRgb) {
      root.style.setProperty('--club-primary-rgb', `${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}`);
    }
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    // Retirer le # si présent
    hex = hex.replace('#', '');

    // Parser le hex en RGB
    if (hex.length === 6) {
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return { r, g, b };
    }

    return null;
  }

  private getDefaultNavigationConfig(): NavigationConfig {
    return {
      desktop: [
        { id: 'classement', label: 'Classement', route: '/classement', enabled: true },
        { id: 'matchs', label: 'Tous les Matchs', route: '/matchs', enabled: true },
        { id: 'matchs-cres', label: 'Nos Matchs', route: '/matchs-cres', enabled: true },
        { id: 'agenda', label: 'Au Crès ce weekend', route: '/agenda', enabled: true },
        { id: 'instagram', label: 'Actu', route: '/instagram', enabled: true },
        { id: 'about', label: 'À propos', route: '/about', enabled: true }
      ],
      mobile: [
        { id: 'classement', label: 'Classement', route: '/classement', enabled: true },
        { id: 'matchs', label: 'Tous les Matchs', route: '/matchs', enabled: true },
        { id: 'matchs-cres', label: 'Nos Matchs', route: '/matchs-cres', enabled: false },
        { id: 'agenda', label: 'Au Crès ce weekend', route: '/agenda', enabled: true },
        { id: 'instagram', label: 'Actu', route: '/instagram', enabled: true },
        { id: 'about', label: 'À propos', route: '/about', enabled: true }
      ]
    };
  }

  getNavigationConfig(): Observable<any> {
    const configRef = doc(this.firestore, 'config', 'navigation');
    return docData(configRef);
  }

  private getDefaultClubConfig(): ClubConfig {
    return {
      name: 'Le Crès Volley-Ball',
      shortName: 'Le Crès VB',
      logo: '/logo-le-cres.ico',
      colors: {
        primary: '#F762A6',
        secondary: '#667eea',
        accent: '#764ba2',
        background: '#f8f9fa',
        text: '#1a1a1a'
      },
      teamKeywords: ['crès', 'cres']
    };
  }

  async updateNavigationConfig(config: NavigationConfig): Promise<void> {
    const configRef = doc(this.firestore, 'config', 'navigation');
    await setDoc(configRef, { navigation: config });
    this.navigationConfig.set(config);
  }

  async updateClubConfig(config: ClubConfig): Promise<void> {
    const configRef = doc(this.firestore, 'config', 'club');
    await setDoc(configRef, config);
    this.clubConfig.set(config);
    this.applyColors(config.colors);
  }
}
