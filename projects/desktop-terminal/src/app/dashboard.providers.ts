import {Provider} from '@angular/core';
import {TerminalDashboardProvidersBuilder} from '@terminal-core-lib/terminal-providers/terminal-dashboard-providers.builder';
import {provideTerminalNetworkIndicator} from '@terminal-core-lib/terminal-providers/terminal-dashboard-network-indicator.providers';
import {provideTerminalNotifications} from '@terminal-core-lib/terminal-providers/terminal-dashboard-push-notifications.providers';
import {provideDesktopSettingsMigrations} from '@terminal-core-lib/features/settings-sync/migrations/settings-migrations.providers';
import {provideClientOrders} from '@terminal-core-lib/features/orders/orders.providers';
import {EXPORT_SETTINGS_SERVICE_TOKEN} from '@terminal-core-lib/features/export-settings/export-settings.types';
import {PUSH_NOTIFICATIONS_CONNECTOR} from '@terminal-core-lib/features/push-notifications/types/push-notifications-connector.types';
import {provideScalperOrderBookSharedServices} from '@terminal-widgets-lib/widgets/scalper-order-book/scalper-order-book.providers';
import {provideBlotterSharedServices} from '@terminal-widgets-lib/widgets/blotter/blotter.providers';
import {environment} from '../environments/environment';
import {provideDesktopWidgetRegistry} from './widget-registry';
import {DesktopExportSettingsService} from './services/desktop-export-settings.service';
import {PushNotificationsBrowserConnector} from '@terminal-core-lib/features/push-notifications/services/push-notifications-browser-connector';

export const dashboardProviders: Provider[] = new TerminalDashboardProvidersBuilder({
  apiUrl: environment.apiUrl
})
  .withProvider(
    provideTerminalNetworkIndicator(),
    provideDesktopSettingsMigrations(),
    provideClientOrders(),
    [
      {
        provide: EXPORT_SETTINGS_SERVICE_TOKEN,
        useClass: DesktopExportSettingsService
      },
    ],
    provideTerminalNotifications({
      provide: PUSH_NOTIFICATIONS_CONNECTOR,
      useClass: PushNotificationsBrowserConnector
    }),
    provideDesktopWidgetRegistry(),
    provideScalperOrderBookSharedServices(),
    provideBlotterSharedServices()
  )
  .build();
