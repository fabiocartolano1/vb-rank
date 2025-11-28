import { Component, OnInit, OnDestroy, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-instagram',
  imports: [],
  templateUrl: './instagram.html',
  styleUrl: './instagram.css',
})
export class Instagram implements OnInit, OnDestroy {
  private platformId = inject(PLATFORM_ID);
  private juicerScript: HTMLScriptElement | null = null;

  ngOnInit() {
    // Charger le script Juicer.io uniquement côté client
    if (isPlatformBrowser(this.platformId)) {
      this.loadJuicerScript();
    }
  }

  ngOnDestroy() {
    // Nettoyer le script lors de la destruction du composant
    if (this.juicerScript && this.juicerScript.parentNode) {
      this.juicerScript.parentNode.removeChild(this.juicerScript);
    }
  }

  private loadJuicerScript() {
    // Vérifier si le script n'est pas déjà chargé
    if (document.querySelector('script[src*="juicer.io/embed/lecres_vb"]')) {
      return;
    }

    // Créer et charger le script Juicer.io spécifique au feed lecres_vb
    this.juicerScript = document.createElement('script');
    this.juicerScript.src = 'https://www.juicer.io/embed/lecres_vb/embed-code.js';
    this.juicerScript.async = true;
    this.juicerScript.defer = true;
    this.juicerScript.type = 'text/javascript';

    document.head.appendChild(this.juicerScript);
  }
}
