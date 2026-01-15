import {Routes} from '@angular/router';

export const routes: Routes = [
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule)
  },
  {
    path: 'dashboard',
    loadChildren: () => import('./client/client.module').then(m => m.ClientModule)
  },
  {
    path: 'auth',
    pathMatch: "prefix",
    redirectTo: 'dashboard/auth'
  },
  {
    path: 'mobile',
    pathMatch: "prefix",
    redirectTo: 'dashboard/mobile'
  },
  {
    path: '',
    pathMatch: "full",
    redirectTo: 'dashboard'
  }
];
