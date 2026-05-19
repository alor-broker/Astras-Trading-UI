import {
  inject,
  Provider,
} from '@angular/core';
import {NzModalService} from 'ng-zorro-antd/modal';
import {provideGraphQl} from '@terminal-core-lib/features/graphql/graph-ql.providers';
import {provideHeaderNotifications} from '@terminal-core-lib/features/header-notifications/services/header-notifications.providers';
import {MarkdownModule} from "ngx-markdown";
import {AllPositionsService} from "@terminal-core-lib/features/client-info/services/all-positions.service";
import {AccountService} from "@terminal-core-lib/features/client-info/services/account-service";
import {SideNotificationsService} from '@terminal-core-lib/features/side-notifications/services/side-notifications.service';
import {provideScalperOrderBookSharedServices} from '@terminal-widgets-lib/widgets/scalper-order-book/scalper-order-book.providers';
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
import {OrderInstantTranslatableNotificationsService} from '@terminal-core-lib/features/orders/services/order-instant-translatable-notifications.service';
import {ORDER_COMMAND_SERVICE_TOKEN} from '@terminal-core-lib/features/orders/types/order-command-service.types';
import {OrdersDialogService} from '@terminal-core-lib/features/orders/services/orders-dialog.service';
import {EvaluationService} from '@terminal-core-lib/features/orders/services/evaluation.service';
import {OrdersGroupService} from '@terminal-core-lib/features/orders/services/order-group.service';
import {MarginOrderConfirmationService} from '@terminal-core-lib/features/orders/services/margin-order-notification.service';
import {ConfirmableOrderCommandsService} from '@terminal-core-lib/features/orders/services/confirmable-order-commands.service';
import {OrderDetailsService} from '@terminal-core-lib/features/orders/services/order-details.service';
import {AdminOrderCommandService} from './services/admin-order-command.service';
import {PUSH_NOTIFICATIONS_CONFIG} from '@terminal-core-lib/features/push-notifications/types/push-notifications-config.types';

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

const orderCommandsProviders = [
  OrderInstantTranslatableNotificationsService,
  {
    provide: ORDER_COMMAND_SERVICE_TOKEN,
    useClass: AdminOrderCommandService
  },
  OrdersDialogService,
  EvaluationService,
  OrdersGroupService,
  MarginOrderConfirmationService,
  ConfirmableOrderCommandsService,
  OrderDetailsService
];

const featureProviders = [
  orderCommandsProviders,
  AllPositionsService,
  AccountService,
  SideNotificationsService,
  NewsService,
  provideSessionTrack(),
  provideFeedback(),
];

const widgetServicesProviders = [
  provideScalperOrderBookSharedServices(),
  provideBlotterSharedServices(),
];

const notificationProviders = [
  provideHeaderNotifications([
    PushNotificationsProvider,
    ApplicationReleaseNotificationProvider
  ]),
  {
    provide: PUSH_NOTIFICATIONS_CONFIG,
    useValue: {
      priceChangeNotifications: {
        isSupported: false
      },
      portfolioOrdersExecuteNotifications: {
        isSupported: false
      }
    }
  },
];

export const dashboardProviders: Provider[] = [
  ...commonServices,
  ...featureProviders,
  ...thirdPartyProviders,
  ...notificationProviders,
  ...provideDesktopWidgetRegistry(),
  ...widgetServicesProviders
];
