import {
  EnvironmentProviders,
  LOCALE_ID,
  makeEnvironmentProviders,
  Provider,
  provideBrowserGlobalErrorListeners
} from '@angular/core';
import {registerLocaleData} from '@angular/common';
import en from '@angular/common/locales/en';
import hy from '@angular/common/locales/hy';
import ru from '@angular/common/locales/ru';
import {
  provideHttpClient,
  withInterceptorsFromDi
} from '@angular/common/http';
import {
  provideRouter,
  Routes,
  withComponentInputBinding
} from '@angular/router';
import {
  provideServiceWorker,
  SwRegistrationOptions
} from '@angular/service-worker';
import {provideAnimationsAsync} from '@angular/platform-browser/animations/async';
import {provideStore} from '@ngrx/store';
import {provideStoreDevtools} from '@ngrx/store-devtools';
import {
  provideNzI18n,
  ru_RU
} from 'ng-zorro-antd/i18n';
import {LocalStorageService} from '@terminal-core-lib/features/local-storage/local-storage.service';
import {provideAuthHttpRequests} from '@terminal-core-lib/features/http-requests/http-requests.providers';
import {provideErrorHandlers} from '@terminal-core-lib/features/errors-handler/error-handler.providers';
import {LogErrorHandler} from '@terminal-core-lib/features/errors-handler/handlers/log-error.handler';
import {GraphQlErrorHandlerService} from '@terminal-core-lib/features/graphql/services/graph-ql-error.handler';
import {provideLogging} from '@terminal-core-lib/features/logging/logging.providers';
import {ConsoleLogger} from '@terminal-core-lib/features/logging/loggers/console-logger';
import {RemoteLogger} from '@terminal-core-lib/features/logging/loggers/remote-logger';
import {
  LANGUAGES_CONFIG,
  LanguagesConfig,
  provideTranslations
} from '@terminal-core-lib/features/translations/translations.provides';
import {LocaleService} from '@terminal-core-lib/features/translations/services/locale.service';
import {provideWatchlist} from '@terminal-core-lib/features/watchlist/watchlist.providers';
import {provideRemoteStorage} from '@terminal-core-lib/features/remote-storage/remote-storage.providers';
import {providePortfoliosStorage} from '@terminal-core-lib/features/portfolios/portfolios-storage.providers';
import {provideTerminalSettingsStorage} from '@terminal-core-lib/features/terminal-settings/terminal-settings-storage.providers';
import {provideWidgetSettingsStorage} from '@terminal-core-lib/features/widget-settings/widget-settings-store.providers';
import {provideWidgetLocalState} from '@terminal-core-lib/features/widget-local-state/widget-local-state.providers';
// DO NOT REMOVE. This import is required for chart.js
import 'chartjs-adapter-date-fns';

type TerminalApplicationProvider = Provider | EnvironmentProviders;

export interface TerminalApplicationServiceWorkerOptions {
  enabled: boolean;
  registrationStrategy?: SwRegistrationOptions['registrationStrategy'];
  script?: string;
}

export interface TerminalApplicationOptions {
  routes: Routes;
  production: boolean;
  languagesConfig: LanguagesConfig;
  ngrxDevtoolsEnabled: boolean;
  environmentProviders: TerminalApplicationProvider[];
  userContextProviders: TerminalApplicationProvider[];
  remoteStorageUrlProvider: Provider;
  dashboardStorageProviders: TerminalApplicationProvider[];
  serviceWorker?: TerminalApplicationServiceWorkerOptions;
  watchlistEnabled?: boolean;
}

function registerTerminalLocaleData(): void {
  registerLocaleData(en);
  registerLocaleData(hy);
  registerLocaleData(ru);
}

function provideTerminalServiceWorker(
  options: TerminalApplicationServiceWorkerOptions | undefined
): EnvironmentProviders[] {
  if (options == null) {
    return [];
  }

  return [
    provideServiceWorker(options.script ?? 'ngsw-worker.js', {
      enabled: options.enabled,
      registrationStrategy: options.registrationStrategy ?? 'registerWithDelay:60000',
    })
  ];
}

export function provideTerminalApplication(options: TerminalApplicationOptions): EnvironmentProviders {
  registerTerminalLocaleData();

  return makeEnvironmentProviders([
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      options.routes,
      withComponentInputBinding()
    ),
    provideAnimationsAsync(),
    provideNzI18n(ru_RU),
    provideHttpClient(withInterceptorsFromDi()),
    ...provideTerminalServiceWorker(options.serviceWorker),
    {
      provide: Window,
      useValue: window
    },
    ...options.environmentProviders,
    ...options.userContextProviders,
    LocalStorageService,
    provideAuthHttpRequests(),
    provideErrorHandlers([
      LogErrorHandler,
      GraphQlErrorHandlerService
    ]),
    provideLogging([
      ConsoleLogger,
      RemoteLogger
    ]),
    provideTranslations(options.production),
    {
      provide: LANGUAGES_CONFIG,
      useValue: options.languagesConfig
    },
    {
      provide: LOCALE_ID,
      deps: [LocaleService],
      useFactory: (localeService: LocaleService): string => localeService.currentLocale,
    },
    ...(options.watchlistEnabled === true ? [provideWatchlist()] : []),
    ...provideRemoteStorage(options.remoteStorageUrlProvider),
    provideStore(),
    ...(options.ngrxDevtoolsEnabled ? [provideStoreDevtools({})] : []),
    providePortfoliosStorage(),
    provideTerminalSettingsStorage(),
    provideWidgetSettingsStorage(),
    ...options.dashboardStorageProviders,
    provideWidgetLocalState(),
  ]);
}
