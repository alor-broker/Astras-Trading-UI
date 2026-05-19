import {Routes} from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/dashboard-shell/dashboard-shell').then(m => m.DashboardShell),
    children: [
      {
        path: 'login',
        loadComponent: () => import('./pages/login-page/login-page').then(m => m.LoginPage),
      },
      {
        path: '',
        loadComponent: () => import('./pages/dashboard-page/dashboard-page').then(m => m.DashboardPage),
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
