import {
  inject,
  Provider,
} from '@angular/core';
import {NzModalService} from 'ng-zorro-antd/modal';
import {provideGraphQl} from '@terminal-core-lib/features/graphql/graph-ql.providers';
import {DeviceNetworkService} from '@terminal-core-lib/common/services/device-network.service';
import {provideNetworkIndicator} from "@terminal-core-lib/features/network-indicator/network-indicator.providers";
import {
  NETWORK_STATUS_PROVIDER,
  ORDER_DELAY_PROVIDER
} from '@terminal-core-lib/features/network-indicator/services/network-status-service.types';
import {SubscriptionsDataFeedService} from '@terminal-core-lib/features/data-subscriptions/services/subscriptions-data-feed.service';
import {WsOrdersConnector} from '@terminal-core-lib/features/orders/services/ws-orders-connector';
import {provideClientOrders} from "@terminal-core-lib/features/orders/orders.providers";
import {provideHeaderNotifications} from '@terminal-core-lib/features/header-notifications/services/header-notifications.providers';
import {MarkdownModule} from "ngx-markdown";
import {AllPositionsService} from "@terminal-core-lib/features/client-info/services/all-positions.service";
import {AccountService} from "@terminal-core-lib/features/client-info/services/account-service";
import {SideNotificationsService} from '@terminal-core-lib/features/side-notifications/services/side-notifications.service';
import {provideScalperOrderBookSharedServices} from '@terminal-widgets-lib/widgets/scalper-order-book/scalper-order-book.providers';
import {providePushNotifications} from '@terminal-core-lib/features/push-notifications/push-notifications.providers';
import {PUSH_NOTIFICATIONS_CONNECTOR} from '@terminal-core-lib/features/push-notifications/types/push-notifications-connector.types';
import {NewsService} from '@terminal-core-lib/features/news/services/news.service';
import {provideSessionTrack} from '@terminal-core-lib/features/session-track/session-track.providers';
import {PushNotificationsProvider} from '@terminal-core-lib/features/push-notifications/services/push-notifications-provider';
import {ApplicationReleaseNotificationProvider} from '@terminal-core-lib/features/app-releases/services/application-release-notification-provider';
import {provideFeedback} from '@terminal-core-lib/features/feedback/feedback.providers';
import {
  provideCharts,
  withDefaultRegisterables
} from 'ng2-charts';
import {provideNamedApollo} from 'apollo-angular';
import {HttpLink} from 'apollo-angular/http';
import {environment} from '../environments/environment';
import {InMemoryCache} from '@apollo/client';
import {provideDesktopWidgetRegistry} from './widget-registry';
import {provideBlotterSharedServices} from '@terminal-widgets-lib/widgets/blotter/blotter.providers';
import {provideMobileSettingsMigrations} from '@terminal-core-lib/features/settings-sync/migrations/settings-migrations.providers';
import {MobilePushNotificationsConnector} from './services/mobile-push-notifications-connector';
import {EXPORT_SETTINGS_SERVICE_TOKEN} from '@terminal-core-lib/features/export-settings/export-settings.types';
import {ExportMobileSettingsService} from './services/export-mobile-settings.service';

// providers from third party dependencies
const thirdPartyProviders: Provider[] = [
  provideCharts(withDefaultRegisterables()),
  provideNamedApollo(() => {
    const httpLink = inject(HttpLink);
    return {
      default: {
        link: httpLink.create({uri: environment.apiUrl + '/hyperion'}),
        cache: new InMemoryCache(),
      },
      news: {
        link: httpLink.create({uri: environment.apiUrl + '/news/graphql'}),
        cache: new InMemoryCache(),
      }
    };
  }),
  NzModalService,
  MarkdownModule.forRoot().providers ?? [],
];

const commonServices = [
  provideGraphQl()
];

const featureProviders = [
  provideNetworkIndicator(
    [
      {
        provide: NETWORK_STATUS_PROVIDER,
        useExisting: DeviceNetworkService,
        multi: true
      },
      {
        provide: NETWORK_STATUS_PROVIDER,
        useExisting: SubscriptionsDataFeedService,
        multi: true
      },
      {
        provide: NETWORK_STATUS_PROVIDER,
        useExisting: WsOrdersConnector,
        multi: true
      }
    ],
    {
      provide: ORDER_DELAY_PROVIDER,
      useExisting: WsOrdersConnector
    }
  ),
  provideMobileSettingsMigrations(),
  provideClientOrders(),
  AllPositionsService,
  AccountService,
  SideNotificationsService,
  NewsService,
  provideSessionTrack(),
  provideFeedback(),
];

const appProviders = [
  {
    provide: EXPORT_SETTINGS_SERVICE_TOKEN,
    useClass: ExportMobileSettingsService
  }
];

const widgetServicesProviders = [
  provideScalperOrderBookSharedServices(),
  provideBlotterSharedServices(),
];

const notificationProviders = [
  providePushNotifications({
      priceChangeNotifications: {
        isSupported: true
      },
      portfolioOrdersExecuteNotifications: {
        isSupported: true
      }
    },
    {
      provide: PUSH_NOTIFICATIONS_CONNECTOR,
      useClass: MobilePushNotificationsConnector
    }
  ),
  provideHeaderNotifications([
    PushNotificationsProvider,
    ApplicationReleaseNotificationProvider
  ])
];

export const dashboardProviders: Provider[] = [
  ...commonServices,
  ...featureProviders,
  ...thirdPartyProviders,
  ...appProviders,
  ...notificationProviders,
  ...provideDesktopWidgetRegistry(),
  ...widgetServicesProviders
];
