import {
  EnvironmentProviders,
  makeEnvironmentProviders
} from '@angular/core';
import {
  CLIENT_DATA_URLS_PROVIDER,
  CORE_API_URL_PROVIDER,
  ICONS_STORAGE_URL_PROVIDER,
  RELEASES_API_URL_PROVIDER,
  URGENT_NOTIFICATIONS_URL_PROVIDER,
  UrgentNotificationsUrlProvider,
  WEB_SOCKET_DATA_URL_PROVIDER,
  WEB_SOCKET_ORDERS_URL_PROVIDER
} from '@terminal-core-lib/config/api-url-providers';
import {LOGGING_CONFIG} from '@terminal-core-lib/features/logging/logger-config.types';
import {EXTERNAL_LINKS_CONFIG} from '@terminal-core-lib/features/external-links/external-links.types';
import {EnvironmentService} from './services/environment.service';
import {FEATURES_CONFIG} from '@terminal-core-lib/config/features-config';
import {INVEST_IDEAS_URL_PROVIDER} from '@terminal-widgets-lib/widgets/invest-ideas/services/invest-ideas-service.types';
import {DEBUG_CONFIG} from '@terminal-core-lib/config/debug-config';

export function provideEnvironmentConfig(): EnvironmentProviders {
  return makeEnvironmentProviders([
    EnvironmentService,
    {
      provide: CLIENT_DATA_URLS_PROVIDER,
      useExisting: EnvironmentService
    },
    {
      provide: CORE_API_URL_PROVIDER,
      useExisting: EnvironmentService
    },
    {
      provide: INVEST_IDEAS_URL_PROVIDER,
      useExisting: EnvironmentService
    },
    {
      provide: LOGGING_CONFIG,
      deps: [EnvironmentService],
      useFactory: (environmentService: EnvironmentService) => environmentService.logging,
    },
    {
      provide: EXTERNAL_LINKS_CONFIG,
      deps: [EnvironmentService],
      useFactory: (environmentService: EnvironmentService) => environmentService.externalLinks,
    },
    {
      provide: ICONS_STORAGE_URL_PROVIDER,
      deps: [EnvironmentService],
      useFactory: (environmentService: EnvironmentService) => ({iconsStorageUrl: environmentService.alorIconsStorageUrl}),
    },
    {
      provide: WEB_SOCKET_DATA_URL_PROVIDER,
      useExisting: EnvironmentService
    },
    {
      provide: WEB_SOCKET_ORDERS_URL_PROVIDER,
      useExisting: EnvironmentService
    },
    {
      provide: RELEASES_API_URL_PROVIDER,
      deps: [EnvironmentService],
      useFactory: (environmentService: EnvironmentService) => ({releasesApi: `${environmentService.warpUrl}/api/releases`}),
    },
    {
      provide: FEATURES_CONFIG,
      deps: [EnvironmentService],
      useFactory: (environmentService: EnvironmentService) => environmentService.features,
    },
    {
      provide: DEBUG_CONFIG,
      deps: [EnvironmentService],
      useFactory: (environmentService: EnvironmentService) => environmentService.debug,
    },
    {
      provide: URGENT_NOTIFICATIONS_URL_PROVIDER,
      deps: [EnvironmentService],
      useFactory: (environmentService: EnvironmentService): UrgentNotificationsUrlProvider => {
        if (environmentService.cmsUrl == null || environmentService.cmsUrl.length == 0) {
          return {
            urgentNotificationsUrl: null
          };
        }

        return {urgentNotificationsUrl: `${environmentService.cmsUrl}/v1/site/cards/ca_hotnews_banners`};
      }
    },
  ]);
}
