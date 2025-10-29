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
  }
];
