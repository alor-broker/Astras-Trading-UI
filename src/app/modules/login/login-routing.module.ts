import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SsoCallbackComponent } from './components/sso-callback/sso-callback.component';
import { LoginPageComponent } from './pages/login-page/login-page.component';

const routes: Routes = [{
  path: 'login',
  component: LoginPageComponent
},  {
  path: 'sso',
  component: SsoCallbackComponent
}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LoginRoutingModule {}
