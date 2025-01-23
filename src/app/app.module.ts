import {
  ErrorHandler,
  NgModule
} from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SharedModule } from './shared/shared.module';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {
  en_US,
  NZ_I18N,
  ru_RU
} from 'ng-zorro-antd/i18n';
import { registerLocaleData } from '@angular/common';
import ru from '@angular/common/locales/ru';
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
import { NzI18nInterface } from "ng-zorro-antd/i18n/nz-i18n.interface";
import { GraphQLModule } from './graphql.module';
import { ServiceWorkerModule } from '@angular/service-worker';
import { NzSpinModule } from "ng-zorro-antd/spin";
import {
  provideCharts,
  withDefaultRegisterables
} from 'ng2-charts';
import { MarkdownModule } from "ngx-markdown";
import { APP_HOOKS } from "./app-hooks";
import "chartjs-adapter-date-fns";

registerLocaleData(ru);

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
    GraphQLModule,
    NzSpinModule
  ],
  providers: [
    {
      provide: NZ_I18N,
      useFactory: (localId: string): NzI18nInterface => {
        switch (localId) {
          case 'en':
            return en_US;
          case 'ru':
            return ru_RU;
          default:
            return ru_RU;
        }
      }
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
    provideHttpClient(withInterceptorsFromDi())
  ]
})
export class AppModule {
}
