import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Match } from '../../models/match.model';

@Component({
  selector: 'app-match-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './match-card.component.html',
  styleUrl: './match-card.component.css',
})
export class MatchCardComponent {
  @Input({ required: true }) match!: Match;
  @Input() getTeamLogo!: (teamName: string) => string;
  @Input() formatDate!: (dateString: string) => string;
  @Input() highlightCres: boolean = false;

  isCresMatch(): boolean {
    return (
      this.match.equipeDomicile.toLowerCase().includes('crès') ||
      this.match.equipeExterieur.toLowerCase().includes('crès') ||
      this.match.equipeDomicile.toLowerCase().includes('cres') ||
      this.match.equipeExterieur.toLowerCase().includes('cres')
    );
  }
}
