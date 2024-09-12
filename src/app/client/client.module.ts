import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClientAreaShellComponent } from './client-area-shell/client-area-shell.component';
import {
  RouterModule,
  Routes
} from "@angular/router";
import { SsoCallbackPageComponent } from './pages/sso-callback-page/sso-callback-page.component';
import { ExternalLogoutPageComponent } from './pages/external-logout-page/external-logout-page.component';
import { MobileDashboardWidgetComponent } from "../modules/dashboard/widgets/mobile-dashboard-widget/mobile-dashboard-widget.component";
import { DashboardWidgetComponent } from "../modules/dashboard/widgets/dashboard-widget/dashboard-widget.component";
import { DashboardModule } from "../modules/dashboard/dashboard.module";

const routes: Routes = [
  {
    path: '',
    component: ClientAreaShellComponent,
    children: [
      {
        path: 'auth',
        children: [
          {
            path: 'sso',
            component: SsoCallbackPageComponent
          },
          {
            path: 'logout',
            component: ExternalLogoutPageComponent
          },
          {
            path: 'logout2',
            pathMatch: "full",
            redirectTo: 'logout'
          },
        ]
      },
      {
        path: 'mobile',
        component: MobileDashboardWidgetComponent
      },
      {
        path: '',
        pathMatch: "full",
        component: DashboardWidgetComponent
      }
    ]
  }
];

@NgModule({
  declarations: [
    ClientAreaShellComponent,
    SsoCallbackPageComponent,
    ExternalLogoutPageComponent
  ],
  imports: [
    CommonModule,
    DashboardModule,
    RouterModule.forChild(routes),
  ]
})
export class ClientModule {
}
