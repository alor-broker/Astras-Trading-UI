import { StoreDevtoolsModule } from "@ngrx/store-devtools";
import { environment } from "../../environments/environment";
import { Provider } from "@angular/core";

export const extModules = [
  StoreDevtoolsModule.instrument({ maxAge: 25, logOnly: environment.production , connectInZone: true})
];

export const extProvides: Provider[] = [];
