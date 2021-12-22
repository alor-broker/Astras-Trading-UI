import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardWidgetComponent } from './widgets/dashboard-widget/dashboard-widget.component';

const routes: Routes = [{ path: '', component: DashboardWidgetComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DashboardRoutingModule { }
