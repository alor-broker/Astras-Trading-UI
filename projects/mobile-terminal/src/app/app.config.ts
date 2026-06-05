import {ApplicationConfig, isDevMode} from '@angular/core';

import {routes} from './app.routes';
import {provideEnvironmentConfig} from './environment.providers';
import {environment} from '../environments/environment';
import {provideMobileDashboardStorage} from './features/dashboard/mobile-dashboard-store.providers';
import {provideClientUserContext} from '@terminal-core-lib/features/user-context/client/client-user-context.providers';
import {REMOTE_STORAGE_URL_PROVIDER} from '@terminal-core-lib/features/remote-storage/remote-storage-url-provider';
import {EnvironmentService} from './services/environment.service';
import {TerminalApplicationProvidersBuilder} from '@terminal-core-lib/terminal-providers/terminal-application.providers';
import {provideTerminalServiceWorker} from '@terminal-core-lib/terminal-providers/terminal-application-service-worker.providers';

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
        provideClientUserContext(),
        provideMobileDashboardStorage(),
        provideTerminalServiceWorker({
          enabled: !isDevMode(),
        })
      )
      .build()
  ]
};
