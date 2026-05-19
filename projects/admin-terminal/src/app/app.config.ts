import {
  ApplicationConfig,
  isDevMode,
  LOCALE_ID,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import {
  provideRouter,
  withComponentInputBinding
} from '@angular/router';
import {provideServiceWorker} from '@angular/service-worker';

import {routes} from './app.routes';
import {registerLocaleData} from '@angular/common';
import ru from '@angular/common/locales/ru';
import {
  provideHttpClient,
  withInterceptorsFromDi
} from '@angular/common/http';
import {provideStore} from '@ngrx/store';
import {provideErrorHandlers} from '@terminal-core-lib/features/errors-handler/error-handler.providers';
import {provideStoreDevtools} from '@ngrx/store-devtools';
import {environment} from '../environments/environment';
import {provideAnimationsAsync} from '@angular/platform-browser/animations/async';
import {LocalStorageService} from '@terminal-core-lib/features/local-storage/local-storage.service';
import {provideAuthHttpRequests} from '@terminal-core-lib/features/http-requests/http-requests.providers';
import {provideLogging} from '@terminal-core-lib/features/logging/logging.providers';
import {ConsoleLogger} from '@terminal-core-lib/features/logging/loggers/console-logger';
import {RemoteLogger} from '@terminal-core-lib/features/logging/loggers/remote-logger';
import {
  provideNzI18n,
  ru_RU
} from 'ng-zorro-antd/i18n';
import {LogErrorHandler} from '@terminal-core-lib/features/errors-handler/handlers/log-error.handler';
import {
  LANGUAGES_CONFIG,
  provideTranslations
} from '@terminal-core-lib/features/translations/translations.provides';
import {provideEnvironmentConfig} from './environment.providers';
import {GraphQlErrorHandlerService} from '@terminal-core-lib/features/graphql/services/graph-ql-error.handler';
// DO NOT REMOVE. This import is required for chart.js
import "chartjs-adapter-date-fns";
import {LocaleService} from '@terminal-core-lib/features/translations/services/locale.service';
import {providePortfoliosStorage} from '@terminal-core-lib/features/portfolios/portfolios-storage.providers';
import {provideTerminalSettingsStorage} from '@terminal-core-lib/features/terminal-settings/terminal-settings-storage.providers';
import {provideWidgetSettingsStorage} from '@terminal-core-lib/features/widget-settings/widget-settings-store.providers';
import {provideDesktopDashboardsStorage} from '@terminal-core-lib/features/dashboard/desktop/desktop-dashboard-store.providers';
import {provideWidgetLocalState} from '@terminal-core-lib/features/widget-local-state/widget-local-state.providers';
import {provideWatchlist} from '@terminal-core-lib/features/watchlist/watchlist.providers';
import {REMOTE_STORAGE_URL_PROVIDER} from '@terminal-core-lib/features/remote-storage/remote-storage-url-provider';
import {EnvironmentService} from './services/environment.service';
import {provideRemoteStorage} from '@terminal-core-lib/features/remote-storage/remote-storage.providers';
import {provideClientUserContext} from '@terminal-core-lib/features/user-context/client/client-user-context.providers';
import {ClientAuthService} from '@terminal-core-lib/features/user-context/client/services/client-auth.service';
import {
  SESSION_CONTEXT,
  USER_CONTEXT
} from '@terminal-core-lib/features/user-context/user-context.types';
import {AdminAuthService} from './services/admin-auth.service';

registerLocaleData(ru);

const frameworkProviders = [
  provideBrowserGlobalErrorListeners(),
  provideRouter(
    routes,
    withComponentInputBinding()
  ),
  provideAnimationsAsync(),
  provideNzI18n(ru_RU),
  provideHttpClient(withInterceptorsFromDi()),
  {
    provide: Window, useValue: window
  }
];

const adminAuthProviders = [
  AdminAuthService,
  {
    provide: USER_CONTEXT,
    useExisting: AdminAuthService
  },
  {
    provide: SESSION_CONTEXT,
    useExisting: AdminAuthService
  }
]

const coreProviders = [
  adminAuthProviders,
  provideEnvironmentConfig(),
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
  provideTranslations(environment.production),
  {
    provide: LANGUAGES_CONFIG,
    useValue: environment.internationalization
  },
  {
    provide: LOCALE_ID,
    deps: [LocaleService],
    useFactory: (localeService: LocaleService): string => localeService.currentLocale,
  },
  provideWatchlist(),
  provideRemoteStorage({
    provide: REMOTE_STORAGE_URL_PROVIDER,
    useExisting: EnvironmentService
  }),
];

const ngrxProviders = [
  provideStore(),
  environment.debug.ngrx
    ? provideStoreDevtools({})
    : [],
  providePortfoliosStorage(),
  provideTerminalSettingsStorage(),
  provideWidgetSettingsStorage(),
  provideDesktopDashboardsStorage(),
  provideWidgetLocalState(),
];

export const appConfig: ApplicationConfig = {
  providers: [
    frameworkProviders,
    coreProviders,
    ngrxProviders,
  ]
};
