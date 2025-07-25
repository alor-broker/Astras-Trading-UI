import {
  ErrorHandler,
  inject,
  LOCALE_ID,
  NgModule
} from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SharedModule } from './shared/shared.module';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import {
  HTTP_INTERCEPTORS,
  provideHttpClient,
  withInterceptorsFromDi
} from '@angular/common/http';
import { StoreModule } from '@ngrx/store';
import { extModules } from "./build-specifics/ext-modules";
import { ErrorHandlerService } from "./shared/services/handle-error/error-handler.service";
import { EffectsModule } from '@ngrx/effects';
import { ApplicationMetaModule } from './modules/application-meta/application-meta.module';
import { AuthInterceptor } from './shared/interceptors/auth.interceptor';
import { TranslocoRootModule } from './transloco-root.module';
import { LOGGER } from './shared/services/logging/logger-base';
import { ConsoleLogger } from './shared/services/logging/console-logger';
import { RemoteLogger } from './shared/services/logging/remote-logger';
import { ServiceWorkerModule } from '@angular/service-worker';
import { NzSpinModule } from "ng-zorro-antd/spin";
import {
  provideCharts,
  withDefaultRegisterables
} from 'ng2-charts';
import { MarkdownModule } from "ngx-markdown";
import { APP_HOOKS } from "./app-hooks";
import "chartjs-adapter-date-fns";
import {
  provideNamedApollo
} from "apollo-angular";
import { HttpLink } from "apollo-angular/http";
import { environment } from "../environments/environment";
import { InMemoryCache } from "@apollo/client/core";
import { LocaleService } from "./shared/services/locale.service";

@NgModule({
  declarations: [
    AppComponent,
  ],
  bootstrap: [AppComponent],
  imports: [AppRoutingModule,
    SharedModule,
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    StoreModule.forRoot({}),
    EffectsModule.forRoot(),
    MarkdownModule.forRoot(),
    ...extModules,
    ApplicationMetaModule,
    TranslocoRootModule,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: true,
      // Register the ServiceWorker as soon as the application is stable
      // or after 15 seconds (whichever comes first).
      // registrationStrategy: 'registerWhenStable:15000'
    }),
    NzSpinModule
  ],
  providers: [
    {
      provide: LOCALE_ID,
      deps: [LocaleService],
      useFactory: (localeService: LocaleService): string => localeService.currentLocale,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    {
      provide: ErrorHandler,
      useClass: ErrorHandlerService
    },

    {
      provide: LOGGER,
      useClass: ConsoleLogger,
      multi: true
    },
    {
      provide: LOGGER,
      useClass: RemoteLogger,
      multi: true
    },
    ...APP_HOOKS,
    provideCharts(withDefaultRegisterables()),
    provideHttpClient(withInterceptorsFromDi()),
    provideNamedApollo(() => {
      const httpLink = inject(HttpLink);

      return {
        default: {
          link: httpLink.create({ uri: environment.apiUrl + '/hyperion' }),
          cache: new InMemoryCache(),
        },
        news: {
          link: httpLink.create({ uri: environment.apiUrl + '/news/graphql' }),
          cache: new InMemoryCache(),
        }
      };
    })
  ]
})
export class AppModule {
}
