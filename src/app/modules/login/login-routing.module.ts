import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {SsoCallbackComponent} from './components/sso-callback/sso-callback.component';
import {ExternalLogoutComponent} from './components/external-logout/external-logout.component';
import { ExternalLogout2Component } from "./components/external-logout-2/external-logout-2.component";

const routes: Routes = [
  {
    path: 'sso',
    component: SsoCallbackComponent
  },
  {
    path: 'logout',
    component: ExternalLogoutComponent,
    pathMatch: 'full'
  },
  {
    path: 'logout2',
    component: ExternalLogout2Component,
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LoginRoutingModule {
}
