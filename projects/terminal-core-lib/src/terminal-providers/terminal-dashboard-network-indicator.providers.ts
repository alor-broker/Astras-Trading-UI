import {Provider} from '@angular/core';
import {DeviceNetworkService} from '@terminal-core-lib/common/services/device-network.service';
import {SubscriptionsDataFeedService} from '@terminal-core-lib/features/data-subscriptions/services/subscriptions-data-feed.service';
import {provideNetworkIndicator} from '@terminal-core-lib/features/network-indicator/network-indicator.providers';
import {
  NETWORK_STATUS_PROVIDER,
  ORDER_DELAY_PROVIDER
} from '@terminal-core-lib/features/network-indicator/services/network-status-service.types';
import {WsOrdersConnector} from '@terminal-core-lib/features/orders/services/ws-orders-connector';

export function provideTerminalNetworkIndicator(): Provider[] {
  return provideNetworkIndicator(
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
  );
}
