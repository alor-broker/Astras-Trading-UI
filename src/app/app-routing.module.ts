import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
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

@NgModule({
  imports: [
    RouterModule.forRoot(
      routes,
      {
        bindToComponentInputs: true
      }
    )
  ],
  exports: [RouterModule],
})
export class AppRoutingModule { }
