import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SsoCallbackComponent } from './components/sso-callback/sso-callback.component';

const routes: Routes = [{
  path: 'sso',
  component: SsoCallbackComponent
}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LoginRoutingModule {}
