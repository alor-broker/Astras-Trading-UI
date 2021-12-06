import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { DashboardPageComponent } from './pages/dashboard-page/dashboard-page.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { GridsterModule } from 'angular-gridster2';
import { NavbarComponent } from './components/navbar/navbar.component';

@NgModule({
  declarations: [
    DashboardPageComponent,
    DashboardComponent,
    NavbarComponent
  ],
  imports: [
    CommonModule,
    DashboardRoutingModule,
    SharedModule,
    GridsterModule,
    // components
  ]
})
export class DashboardModule { }
