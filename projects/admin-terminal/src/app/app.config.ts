import {ApplicationConfig} from '@angular/core';

import {routes} from './app.routes';
import {environment} from '../environments/environment';
import {provideEnvironmentConfig} from './environment.providers';
import {provideDesktopDashboardsStorage} from '@terminal-core-lib/features/dashboard/desktop/desktop-dashboard-store.providers';
import {REMOTE_STORAGE_URL_PROVIDER} from '@terminal-core-lib/features/remote-storage/remote-storage-url-provider';
import {EnvironmentService} from './services/environment.service';
import {
  SESSION_CONTEXT,
  USER_CONTEXT
} from '@terminal-core-lib/features/user-context/user-context.types';
import {AdminAuthService} from './services/admin-auth.service';
import {TerminalApplicationProvidersBuilder} from '@terminal-core-lib/terminal-providers/terminal-application.providers';
import {provideWatchlist} from '@terminal-core-lib/features/watchlist/watchlist.providers';

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
];

export const appConfig: ApplicationConfig = {
  providers: [
    new TerminalApplicationProvidersBuilder({
      routes,
      production: environment.production,
      languagesConfig: environment.internationalization,
      ngrxDevtoolsEnabled: environment.debug.ngrx,
      remoteStorageUrlProvider: {
        provide: REMOTE_STORAGE_URL_PROVIDER,
        useExisting: EnvironmentService
      }
    })
      .withProvider(
        provideEnvironmentConfig(),
        adminAuthProviders,
        provideDesktopDashboardsStorage(),
        provideWatchlist()
      )
      .build()
  ]
};
