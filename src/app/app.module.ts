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
  HttpClientModule
} from '@angular/common/http';
import { StoreModule } from '@ngrx/store';
import { extModules } from "./build-specifics/ext-modules";
import { ErrorHandlerService } from "./shared/services/handle-error/error-handler.service";
import { EffectsModule } from '@ngrx/effects';
import { ApplicationMetaModule } from './modules/application-meta/application-meta.module';
import { AuthInterceptor } from './shared/interceptors/auth.interceptor';
import { TranslocoRootModule } from './transloco-root.module';
import {
  TRANSLOCO_MISSING_HANDLER,
  TranslocoConfig,
  TranslocoMissingHandler
} from "@ngneat/transloco";
import { APP_HOOK } from "./shared/services/app-hook/app-hook-token";
import { AppSessionTrackHook } from "./shared/services/session/app-session-track-hook";
import { InitTerminalSettingsHook } from "./shared/services/app-hook/init-terminal-settings-hook";
import { ThemeChangesHook } from "./shared/services/app-hook/theme-changes-hook";
import { TranslationHook } from "./shared/services/app-hook/translation-hook";
import { LOGGER } from './shared/services/logging/logger-base';
import { ConsoleLogger } from './shared/services/logging/console-logger';
import { RemoteLogger } from './shared/services/logging/remote-logger';
import { environment } from "../environments/environment";
import { AngularFireAuthModule } from "@angular/fire/compat/auth";
import { AngularFireMessagingModule } from "@angular/fire/compat/messaging";
import { AngularFireModule } from "@angular/fire/compat";
import {MobileHook} from "./shared/services/app-hook/mobile-hook";

class CustomHandler implements TranslocoMissingHandler {
  handle(key: string, config: TranslocoConfig, params?: any) {
    return params?.fallback || '';
  }
}

registerLocaleData(ru);

@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    AppRoutingModule,
    SharedModule,
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    HttpClientModule,
    StoreModule.forRoot({}),
    EffectsModule.forRoot(),
    ...extModules,
    ApplicationMetaModule,
    TranslocoRootModule,
    AngularFireAuthModule,
    AngularFireMessagingModule,
    AngularFireModule.initializeApp(environment.firebase)
  ],
  bootstrap: [AppComponent],
  providers: [
    {
      provide: NZ_I18N,
      useFactory: (localId: string) => {
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
    { provide: ErrorHandler, useClass: ErrorHandlerService },
    {
      provide: TRANSLOCO_MISSING_HANDLER,
      useClass: CustomHandler
    },
    {
      provide: APP_HOOK,
      useClass: AppSessionTrackHook,
      multi: true
    },
    {
      provide: APP_HOOK,
      useClass: InitTerminalSettingsHook,
      multi: true
    },
    {
      provide: APP_HOOK,
      useClass: ThemeChangesHook,
      multi: true
    },
    {
      provide: APP_HOOK,
      useClass: TranslationHook,
      multi: true
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
    {
      provide: APP_HOOK,
      useClass: MobileHook,
      multi: true
    },
  ]
})
export class AppModule {
}
