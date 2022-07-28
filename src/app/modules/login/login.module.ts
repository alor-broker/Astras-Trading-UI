import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';

import { LoginRoutingModule } from './login-routing.module';
import { SsoCallbackComponent } from './components/sso-callback/sso-callback.component';


@NgModule({
  declarations: [
    SsoCallbackComponent
  ],
  imports: [
    SharedModule,
    LoginRoutingModule
  ]
})
export class LoginModule {
}
