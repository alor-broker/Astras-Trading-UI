import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ClientAreaShellComponent} from './client-area-shell/client-area-shell.component';
import {RouterModule, Routes} from "@angular/router";
import {SsoCallbackPageComponent} from './pages/sso-callback-page/sso-callback-page.component';
import {ExternalLogoutPageComponent} from './pages/external-logout-page/external-logout-page.component';
import {DashboardModule} from "../modules/dashboard/dashboard.module";
import {USER_CONTEXT} from "../shared/services/auth/user-context";
import {SESSION_CONTEXT} from "../shared/services/auth/session-context";
import {AtsStoreModule} from "../store/ats-store.module";
import {AREA_HOOKS} from "./area-hooks";
import {ClientAuthContextService} from "./services/auth/client-auth-context.service";
import {ORDER_COMMAND_SERVICE_TOKEN} from "../shared/services/orders/order-command.service";
import {ClientOrderCommandService} from "./services/orders/client-order-command.service";
import {PUSH_NOTIFICATIONS_CONFIG} from "../modules/push-notifications/services/push-notifications-config";
import {ClientDashboardComponent} from "./pages/client-dashboard/client-dashboard.component";
import {MobileDashboardComponent} from "./pages/mobile-dashboard/mobile-dashboard.component";

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
        component: MobileDashboardComponent
      },
      {
        path: '',
        pathMatch: "full",
        component: ClientDashboardComponent
      }
    ]
  }
];

@NgModule({
  declarations: [
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
    ClientOrderCommandService,
    {
      provide: USER_CONTEXT,
      useExisting: ClientAuthContextService
    },
    {
      provide: SESSION_CONTEXT,
      useExisting: ClientAuthContextService
    },
    {
      provide: ORDER_COMMAND_SERVICE_TOKEN,
      useClass: ClientOrderCommandService
    },
    {
      provide: PUSH_NOTIFICATIONS_CONFIG,
      useValue: {
        priceChangeNotifications: {
          isSupported: true
        },
        portfolioOrdersExecuteNotifications: {
          isSupported: true
        }
      }
    },
    ...AREA_HOOKS
  ]
})
export class ClientModule {
}
