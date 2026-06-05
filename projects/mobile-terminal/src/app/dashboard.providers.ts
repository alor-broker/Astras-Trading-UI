import {Provider} from '@angular/core';
import {TerminalDashboardProvidersBuilder} from '@terminal-core-lib/terminal-providers/terminal-dashboard-providers.builder';
import {provideTerminalNetworkIndicator} from '@terminal-core-lib/terminal-providers/terminal-dashboard-network-indicator.providers';
import {provideTerminalNotifications} from '@terminal-core-lib/terminal-providers/terminal-dashboard-push-notifications.providers';
import {provideMobileSettingsMigrations} from '@terminal-core-lib/features/settings-sync/migrations/settings-migrations.providers';
import {provideClientOrders} from '@terminal-core-lib/features/orders/orders.providers';
import {EXPORT_SETTINGS_SERVICE_TOKEN} from '@terminal-core-lib/features/export-settings/export-settings.types';
import {PUSH_NOTIFICATIONS_CONNECTOR} from '@terminal-core-lib/features/push-notifications/types/push-notifications-connector.types';
import {provideScalperOrderBookSharedServices} from '@terminal-widgets-lib/widgets/scalper-order-book/scalper-order-book.providers';
import {provideBlotterSharedServices} from '@terminal-widgets-lib/widgets/blotter/blotter.providers';
import {environment} from '../environments/environment';
import {provideMobileWidgetRegistry} from './widget-registry';
import {ExportMobileSettingsService} from './services/export-mobile-settings.service';
import {MobilePushNotificationsConnector} from './services/mobile-push-notifications-connector';

export const dashboardProviders: Provider[] = new TerminalDashboardProvidersBuilder({
  apiUrl: environment.apiUrl
})
  .withProvider(
    provideTerminalNetworkIndicator(),
    provideMobileSettingsMigrations(),
    provideClientOrders(),
    [
      {
        provide: EXPORT_SETTINGS_SERVICE_TOKEN,
        useClass: ExportMobileSettingsService
      }
    ],
    provideTerminalNotifications({
      provide: PUSH_NOTIFICATIONS_CONNECTOR,
      useClass: MobilePushNotificationsConnector
    }),
    provideMobileWidgetRegistry(),
    provideScalperOrderBookSharedServices(),
    provideBlotterSharedServices()
  )
  .build();
