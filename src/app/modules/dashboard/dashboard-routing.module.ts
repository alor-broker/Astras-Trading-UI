import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardWidgetComponent } from './widgets/dashboard-widget/dashboard-widget.component';
import { MobileDashboardWidgetComponent } from "./widgets/mobile-dashboard-widget/mobile-dashboard-widget.component";

const routes: Routes = [
  { path: '', component: DashboardWidgetComponent },
  { path: 'mobile', component: MobileDashboardWidgetComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DashboardRoutingModule { }
