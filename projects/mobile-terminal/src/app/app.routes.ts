import {Routes} from '@angular/router';

export const routes: Routes = [
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard-shell/dashboard-shell').then(m => m.DashboardShell),
  },
  {
    path: 'auth',
    children: [
      {
        path: 'sso',
        loadComponent: () => import('@terminal-core-lib/features/user-context/client/pages/sso-callback-page/sso-callback-page').then(m => m.SsoCallbackPage)
      },
      {
        path: 'logout',
        loadComponent: () => import('@terminal-core-lib/features/user-context/client/pages/external-logout-page/external-logout-page').then(m => m.ExternalLogoutPage)
      },
      {
        path: 'logout2',
        pathMatch: "full",
        redirectTo: 'logout'
      },
    ]
  },
  {
    path: '',
    pathMatch: "full",
    redirectTo: 'dashboard'
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
