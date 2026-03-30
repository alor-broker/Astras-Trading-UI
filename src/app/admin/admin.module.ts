import {NgModule} from '@angular/core';
import {RouterModule, Routes} from "@angular/router";
import {LoginPageComponent} from "./pages/login-page/login-page.component";
import {AdminDashboardComponent} from "./pages/admin-dashboard/admin-dashboard.component";
import {AdminAreaShellComponent} from './admin-area-shell/admin-area-shell.component';
import {AtsStoreModule} from "../store/ats-store.module";
import {USER_CONTEXT} from "../shared/services/auth/user-context";
import {SESSION_CONTEXT} from "../shared/services/auth/session-context";
import {AREA_HOOKS} from "../client/area-hooks";
import {AdminAuthContextService} from "./services/auth/admin-auth-context.service";
import {ORDER_COMMAND_SERVICE_TOKEN} from "../shared/services/orders/order-command.service";
import {AdminOrderCommandService} from "./services/orders/admin-order-command.service";
import {PUSH_NOTIFICATIONS_CONFIG} from "../modules/push-notifications/services/push-notifications-config";

const routes: Routes = [
  {
    path: '',
    component: AdminAreaShellComponent,
    children: [
      {path: 'login', component: LoginPageComponent},
      {path: '', component: AdminDashboardComponent}
    ]
  }
];

@NgModule({
  imports: [
    RouterModule.forChild(routes),
    AtsStoreModule,
  ],
  providers: [
    AdminAuthContextService,
    AdminOrderCommandService,
    {
      provide: USER_CONTEXT,
      useExisting: AdminAuthContextService
    },
    {
      provide: SESSION_CONTEXT,
      useExisting: AdminAuthContextService
    },
    {
      provide: ORDER_COMMAND_SERVICE_TOKEN,
      useExisting: AdminOrderCommandService
    },
    {
      provide: PUSH_NOTIFICATIONS_CONFIG,
      useValue: {
        priceChangeNotifications: {
          isSupported: false
        },
        portfolioOrdersExecuteNotifications: {
          isSupported: false
        }
      }
    },
    ...AREA_HOOKS
  ]
})
export class AdminModule {
}
