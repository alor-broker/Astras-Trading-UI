import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  RouterModule,
  Routes
} from "@angular/router";
import { LoginPageComponent } from "./pages/login-page/login-page.component";
import { AdminDashboardComponent } from "./pages/admin-dashboard/admin-dashboard.component";

const routes: Routes = [
  { path: 'login', component: LoginPageComponent },
  { path: '', component: AdminDashboardComponent }
];

@NgModule({
  declarations: [],
  imports: [
    RouterModule.forChild(routes),
    CommonModule
  ]
})
export class AdminModule { }
