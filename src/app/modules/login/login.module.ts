import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';

import { LoginRoutingModule } from './login-routing.module';
import { LoginFormComponent } from './components/login-form/login-form.component';
import { LoginPageComponent } from './pages/login-page/login-page.component';
import { SsoCallbackComponent } from './components/sso-callback/sso-callback.component';


@NgModule({
  declarations: [
    LoginFormComponent,
    LoginPageComponent,
    SsoCallbackComponent
  ],
  imports: [
    SharedModule,
    LoginRoutingModule
  ]
})
export class LoginModule {
}
