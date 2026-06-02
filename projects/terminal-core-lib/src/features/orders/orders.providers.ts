import {Provider} from '@angular/core';
import {OrdersDialogService} from './services/orders-dialog.service';
import {WsOrdersConnector} from '@terminal-core-lib/features/orders/services/ws-orders-connector';
import {OrderInstantTranslatableNotificationsService} from '@terminal-core-lib/features/orders/services/order-instant-translatable-notifications.service';
import {ORDER_COMMAND_SERVICE_TOKEN} from '@terminal-core-lib/features/orders/types/order-command-service.types';
import {ClientOrderCommandService} from '@terminal-core-lib/features/orders/services/client-order-command.service';
import {EvaluationService} from '@terminal-core-lib/features/orders/services/evaluation.service';
import {OrdersGroupService} from '@terminal-core-lib/features/orders/services/order-group.service';
import {MarginOrderConfirmationService} from '@terminal-core-lib/features/orders/services/margin-order-notification.service';
import {ConfirmableOrderCommandsService} from '@terminal-core-lib/features/orders/services/confirmable-order-commands.service';
import {OrderDetailsService} from '@terminal-core-lib/features/orders/services/order-details.service';

export function provideClientOrders(): Provider[] {
  return [
    WsOrdersConnector,
    OrderInstantTranslatableNotificationsService,
    {
      provide: ORDER_COMMAND_SERVICE_TOKEN,
      useClass: ClientOrderCommandService
    },
    OrdersDialogService,
    EvaluationService,
    OrdersGroupService,
    MarginOrderConfirmationService,
    ConfirmableOrderCommandsService,
    OrderDetailsService
  ];
}
