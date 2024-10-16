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
import { USER_CONTEXT } from "../shared/services/auth/user-context";
import { SESSION_CONTEXT } from "../shared/services/auth/session-context";
import { AtsStoreModule } from "../store/ats-store.module";
import { AREA_HOOKS } from "./area-hooks";
import { ClientAuthContextService } from "./services/auth/client-auth-context.service";
import { OrderCommandService } from "../shared/services/orders/order-command.service";
import { ClientOrderCommandService } from "./services/orders/client-order-command.service";

const routes: Routes = [
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
    path: '',
    component: ClientAreaShellComponent,
    children: [
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
    AtsStoreModule,
  ],
  providers: [
    ClientAuthContextService,
    {
      provide: USER_CONTEXT,
      useExisting: ClientAuthContextService
    },
    {
      provide: SESSION_CONTEXT,
      useExisting: ClientAuthContextService
    },
    {
      provide: OrderCommandService,
      useClass: ClientOrderCommandService
    },
    ...AREA_HOOKS
  ]
})
export class ClientModule {
}
