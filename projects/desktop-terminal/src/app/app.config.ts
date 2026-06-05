import {ApplicationConfig, isDevMode} from '@angular/core';

import {routes} from './app.routes';
import {environment} from '../environments/environment';
import {provideEnvironmentConfig} from './environment.providers';
import {provideDesktopDashboardsStorage} from '@terminal-core-lib/features/dashboard/desktop/desktop-dashboard-store.providers';
import {REMOTE_STORAGE_URL_PROVIDER} from '@terminal-core-lib/features/remote-storage/remote-storage-url-provider';
import {EnvironmentService} from './services/environment.service';
import {provideClientUserContext} from '@terminal-core-lib/features/user-context/client/client-user-context.providers';
import {provideTerminalApplication} from '@terminal-core-lib/config/terminal-application.providers';

export const appConfig: ApplicationConfig = {
  providers: [
    provideTerminalApplication({
      routes,
      production: environment.production,
      languagesConfig: environment.internationalization,
      ngrxDevtoolsEnabled: environment.debug.ngrx,
      environmentProviders: [provideEnvironmentConfig()],
      userContextProviders: [provideClientUserContext()],
      remoteStorageUrlProvider: {
        provide: REMOTE_STORAGE_URL_PROVIDER,
        useExisting: EnvironmentService
      },
      dashboardStorageProviders: [provideDesktopDashboardsStorage()],
      serviceWorker: {
        enabled: !isDevMode(),
      },
      watchlistEnabled: true,
    })
  ]
};
