import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  RouterModule,
  Routes
} from "@angular/router";
import { LoginPageComponent } from "./pages/login-page/login-page.component";
import { AdminDashboardComponent } from "./pages/admin-dashboard/admin-dashboard.component";
import { AdminAreaShellComponent } from './admin-area-shell/admin-area-shell.component';

const routes: Routes = [
  {
    path: '',
    component: AdminAreaShellComponent,
    children: [
      { path: 'login', component: LoginPageComponent },
      { path: '', component: AdminDashboardComponent }
    ]
  }
];

@NgModule({
  declarations: [
    AdminAreaShellComponent
  ],
  imports: [
    RouterModule.forChild(routes),
    CommonModule
  ]
})
export class AdminModule {
}
