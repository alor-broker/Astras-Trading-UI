import { StoreDevtoolsModule } from "@ngrx/store-devtools";
import { environment } from "../../environments/environment";
import { Provider } from "@angular/core";
import { InvestIdeasService } from "../modules/invest-ideas/services/invest-ideas.service";
import { InvestIdeasMockService } from "../modules/invest-ideas/services/invest-ideas-mock.service";

export const extModules = [
  StoreDevtoolsModule.instrument({ maxAge: 25, logOnly: environment.production , connectInZone: true})
];

export const extProvides: Provider[] = [
  {
    provide: InvestIdeasService,
    useClass: InvestIdeasMockService
  }
];
