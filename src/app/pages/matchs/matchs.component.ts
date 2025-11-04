import { Component, inject, OnInit, signal, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../services/data.service';
import { EquipeFilterService } from '../../services/equipe-filter.service';
import { Match } from '../../models/match.model';
import { Equipe } from '../../models/equipe.model';
import { MatchCardComponent } from '../../components/match-card/match-card.component';
import { ChampionnatDropdownComponent } from '../../components/championnat-dropdown/championnat-dropdown';

@Component({
  selector: 'app-matchs',
  standalone: true,
  imports: [CommonModule, MatchCardComponent, ChampionnatDropdownComponent],
  templateUrl: './matchs.component.html',
  styleUrl: './matchs.component.css',
})
export class MatchsComponent implements OnInit {
  private dataService = inject(DataService);
  private equipeFilterService = inject(EquipeFilterService);

  allMatchs = signal<Match[]>([]);
  allEquipes = signal<Equipe[]>([]);
  loading = signal(true);
  error = signal('');
  openJournees = signal<Set<number>>(new Set());

  readonly championnats = [
    // Adultes
    { label: 'Nationale 3 F', value: 'Nationale 3 F' },
    { label: 'Prénationale M', value: 'Pré-nationale M' },
    { label: 'Prénationale F', value: 'Pré-nationale F' },
    { label: 'Régionale 2 M', value: 'Régionale 2 M' },
    { label: 'Régionale 2 F', value: 'Régionale 2 F' },
    // Jeunes
    { label: 'M18 M', value: 'm18-m' },
    { label: 'Benjamines', value: 'bfc' },
    { label: 'Benjamins', value: 'bmb' },
    { label: 'Minimes F', value: 'mfd' },
    { label: 'Minimes M', value: 'mmb' },
    { label: 'Cadettes', value: 'cfd' },
  ];

  // Signal pour le championnat sélectionné
  selectedChampionnatId = this.equipeFilterService.getSelectedChampionnatIdSignal();
  selectedEquipe = this.equipeFilterService.getSelectedEquipeSignal();

  // Computed signals pour filtrer par championnat
  matchs = computed(() => {
    const championnatId = this.selectedChampionnatId();
    const all = this.allMatchs();
    return all.filter((match) => match.championnatId === championnatId);
  });

  equipes = computed(() => {
    const championnatId = this.selectedChampionnatId();
    const all = this.allEquipes();
    return all.filter((equipe) => equipe.championnatId === championnatId);
  });

  constructor() {
    // Réagir aux changements de matchs (qui changent quand le championnat change)
    effect(() => {
      const currentMatchs = this.matchs();
      // Ouvrir automatiquement la prochaine journée quand les matchs changent
      if (currentMatchs.length > 0) {
        this.openNextJournee();
      }
    });

    // Scroller vers la journée ouverte après le rendu
    effect(() => {
      const openJournees = this.openJournees();
      if (openJournees.size > 0) {
        // Attendre que le DOM soit mis à jour
        setTimeout(() => {
          this.scrollToOpenJournee();
        }, 100);
      }
    });
  }

  ngOnInit() {
    this.loadData();
  }

  private loadData() {
    this.loading.set(true);
    this.error.set('');

    // Charger toutes les équipes
    this.dataService.getEquipes().subscribe({
      next: (data) => {
        this.allEquipes.set(data);
      },
      error: (err) => {
        console.error('Erreur lors du chargement des équipes:', err);
      },
    });

    // Charger tous les matchs
    this.dataService.getMatchs().subscribe({
      next: (data) => {
        this.allMatchs.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Erreur lors du chargement des matchs');
        this.loading.set(false);
        console.error(err);
      },
    });
  }

  getTeamLogo(teamName: string): string {
    const equipe = this.equipes().find((e) => e.nom === teamName);
    return (
      equipe?.logoUrl || 'https://ui-avatars.com/api/?name=VB&background=667eea&color=fff&size=128'
    );
  }

  getMatchsByJournee() {
    const matchsByJournee = new Map<number, Match[]>();
    this.matchs().forEach((match) => {
      // Cacher les matchs avec "xxx" (journée sans match)
      if (
        match.equipeDomicile.toLowerCase().includes('xxx') ||
        match.equipeExterieur.toLowerCase().includes('xxx')
      ) {
        return;
      }

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
      year: 'numeric',
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
    return (
      match.equipeDomicile.toLowerCase().includes('crès') ||
      match.equipeExterieur.toLowerCase().includes('crès') ||
      match.equipeDomicile.toLowerCase().includes('cres') ||
      match.equipeExterieur.toLowerCase().includes('cres')
    );
  }

  private openNextJournee() {
    const now = new Date();

    // Trouver les matchs à venir (date dans le futur)
    const matchsAVenir = this.matchs().filter((match) => {
      const matchDate = new Date(match.date + (match.heure ? 'T' + match.heure : ''));
      return matchDate >= now;
    });

    if (matchsAVenir.length === 0) {
      return; // Aucun match à venir, tout reste fermé
    }

    // Trier par date pour trouver le prochain match
    const prochainMatch = matchsAVenir.sort((a, b) => {
      const dateA = new Date(a.date + (a.heure ? 'T' + a.heure : '')).getTime();
      const dateB = new Date(b.date + (b.heure ? 'T' + b.heure : '')).getTime();
      return dateA - dateB;
    })[0];

    // Ouvrir la journée du prochain match
    if (prochainMatch) {
      this.openJournees.set(new Set([prochainMatch.journee]));
    }
  }

  private scrollToOpenJournee() {
    const openJournees = this.openJournees();
    if (openJournees.size === 0) return;

    // Récupérer la première journée ouverte
    const firstOpenJournee = Array.from(openJournees)[0];
    const element = document.getElementById(`journee-${firstOpenJournee}`);

    if (element) {
      // Calculer l'offset pour positionner l'élément en haut avec un peu de marge
      const offset = 100; // Marge en pixels depuis le haut
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  }

  onChampionnatChange(equipe: string) {
    this.equipeFilterService.setSelectedEquipe(equipe);
  }
}
