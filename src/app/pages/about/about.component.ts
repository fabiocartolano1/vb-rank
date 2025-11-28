import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.css']
})
export class AboutComponent {
  openPrivacyPolicy(): void {
    window.open('/legal/privacy.html', '_blank');
  }

  openTermsOfService(): void {
    window.open('/legal/terms.html', '_blank');
  }
}
