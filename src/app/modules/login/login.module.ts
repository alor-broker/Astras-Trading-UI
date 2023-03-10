import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';

import { LoginRoutingModule } from './login-routing.module';
import { SsoCallbackComponent } from './components/sso-callback/sso-callback.component';
import { ExternalLogoutComponent } from './components/external-logout/external-logout.component';


@NgModule({
  declarations: [
    SsoCallbackComponent,
    ExternalLogoutComponent
  ],
  imports: [
    SharedModule,
    LoginRoutingModule
  ]
})
export class LoginModule {
}
