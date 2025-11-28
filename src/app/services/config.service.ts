import { Injectable, inject, signal } from '@angular/core';
import { Firestore, doc, docData, setDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

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

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private firestore = inject(Firestore);

  navigationConfig = signal<NavigationConfig | null>(null);

  constructor() {
    this.loadNavigationConfig();
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
        console.error('Erreur lors du chargement de la configuration:', error);
        // Utiliser la configuration par défaut
        this.navigationConfig.set(this.getDefaultConfig());
      }
    });
  }

  private getDefaultConfig(): NavigationConfig {
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

  async updateNavigationConfig(config: NavigationConfig): Promise<void> {
    const configRef = doc(this.firestore, 'config', 'navigation');
    await setDoc(configRef, { navigation: config });
    this.navigationConfig.set(config);
  }
}
