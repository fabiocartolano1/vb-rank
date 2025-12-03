import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'classement',
    pathMatch: 'full'
  },
  {
    path: 'classement',
    loadComponent: () => import('./pages/classement/classement.component').then(m => m.ClassementComponent)
  },
  {
    path: 'matchs',
    loadComponent: () => import('./pages/matchs/matchs.component').then(m => m.MatchsComponent)
  },
  {
    path: 'matchs-cres',
    loadComponent: () => import('./pages/matchs-cres/matchs-cres.component').then(m => m.MatchsCresComponent)
  },
  {
    path: 'agenda',
    loadComponent: () => import('./pages/agenda/agenda.component').then(m => m.AgendaComponent)
  },
  {
    path: 'instagram',
    loadComponent: () => import('./pages/instagram/instagram').then(m => m.Instagram)
  },
  {
    path: 'about',
    loadComponent: () => import('./pages/about/about.component').then(m => m.AboutComponent)
  },
  {
    path: 'about-fufc',
    loadComponent: () => import('./pages/about-fufc/about-fufc.component').then(m => m.AboutFufcComponent)
  }
];
