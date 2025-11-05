import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Match } from '../../models/match.model';
import { TeamUtils } from '../../core/utils/team.utils';

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
    return TeamUtils.isCresMatch(this.match);
  }
}
