import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from 'src/app/shared/shared.module';
import { LoginPageComponent } from './pages/login-page/login-page.component';

const routes: Routes = [{ path: '', component: LoginPageComponent }];

@NgModule({
  imports: [
    RouterModule.forChild(routes),
    SharedModule
  ],
  exports: [RouterModule]
})
export class LoginRoutingModule { }
