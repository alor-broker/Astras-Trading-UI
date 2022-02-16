import { NgModule } from '@angular/core';
import { ProfileRoutingModule } from './profile-routing.module';
import { ProfilePageComponent } from './pages/profile-page/profile-page.component';
import { PortfolioComponent } from './components/portfolio/portfolio.component';
import { PortfolioService } from './services/portfolio.service';
import { SharedModule } from '../../shared/shared.module';



@NgModule({
  imports: [
    ProfileRoutingModule,
    SharedModule
  ],
  declarations: [
    ProfilePageComponent,
    PortfolioComponent
  ],
  providers: [
    PortfolioService
  ],
})

export class ProfileModule { }
// export class ProfileModule {
// 	static forRoot(): ModuleWithProviders<ProfileModule> {
// 		return {
// 			ngModule: ProfileModule,
// 			providers: [PortfolioService]
// 		}
// 	}
// }
