import {Provider} from '@angular/core';
import {OrdersNotificationsService} from '@terminal-widgets-lib/widgets/blotter/services/order-notifications.service';

export function provideBlotterSharedServices(): Provider[] {
  return [
    OrdersNotificationsService
  ];
}
