import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  RouterModule,
  Routes
} from "@angular/router";
import { LoginPageComponent } from "./pages/login-page/login-page.component";
import { AdminDashboardComponent } from "./pages/admin-dashboard/admin-dashboard.component";
import { AdminAreaShellComponent } from './admin-area-shell/admin-area-shell.component';
import { DashboardModule } from "../modules/dashboard/dashboard.module";
import { AtsStoreModule } from "../store/ats-store.module";
import { USER_CONTEXT } from "../shared/services/auth/user-context";
import { SESSION_CONTEXT } from "../shared/services/auth/session-context";
import { AREA_HOOKS } from "../client/area-hooks";
import { AdminAuthContextService } from "./services/auth/admin-auth-context.service";
import { OrderCommandService } from "../shared/services/orders/order-command.service";
import { AdminOrderCommandService } from "./services/orders/admin-order-command.service";

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
    CommonModule,
    DashboardModule,
    RouterModule.forChild(routes),
    AtsStoreModule,
  ],
  providers: [
    AdminAuthContextService,
    {
      provide: USER_CONTEXT,
      useExisting: AdminAuthContextService
    },
    {
      provide: SESSION_CONTEXT,
      useExisting: AdminAuthContextService
    },
    {
      provide: OrderCommandService,
      useClass: AdminOrderCommandService
    },
    ...AREA_HOOKS
  ]
})
export class AdminModule {
}
