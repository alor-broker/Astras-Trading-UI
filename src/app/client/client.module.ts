import {NgModule} from '@angular/core';
import {ClientAreaShellComponent} from './client-area-shell/client-area-shell.component';
import {RouterModule, Routes} from "@angular/router";
import {SsoCallbackPageComponent} from './pages/sso-callback-page/sso-callback-page.component';
import {ExternalLogoutPageComponent} from './pages/external-logout-page/external-logout-page.component';
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
import {JoyrideModule} from "ngx-joyride";

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
  imports: [
    RouterModule.forChild(routes),
    AtsStoreModule,
    SsoCallbackPageComponent,
    ExternalLogoutPageComponent,
    JoyrideModule
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
