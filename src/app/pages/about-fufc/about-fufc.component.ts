import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-about-fufc',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './about-fufc.component.html',
  styleUrls: ['./about-fufc.component.css']
})
export class AboutFufcComponent {
  openPrivacyPolicy(): void {
    window.open('/legal/privacy.html', '_blank');
  }

  openTermsOfService(): void {
    window.open('/legal/terms.html', '_blank');
  }
}
