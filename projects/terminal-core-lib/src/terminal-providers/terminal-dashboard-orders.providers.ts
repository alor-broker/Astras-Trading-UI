import {
  Provider,
  Type
} from '@angular/core';
import {ConfirmableOrderCommandsService} from '@terminal-core-lib/features/orders/services/confirmable-order-commands.service';
import {EvaluationService} from '@terminal-core-lib/features/orders/services/evaluation.service';
import {MarginOrderConfirmationService} from '@terminal-core-lib/features/orders/services/margin-order-notification.service';
import {OrderDetailsService} from '@terminal-core-lib/features/orders/services/order-details.service';
import {OrdersDialogService} from '@terminal-core-lib/features/orders/services/orders-dialog.service';
import {OrdersGroupService} from '@terminal-core-lib/features/orders/services/order-group.service';
import {OrderInstantTranslatableNotificationsService} from '@terminal-core-lib/features/orders/services/order-instant-translatable-notifications.service';
import {
  OrderCommandService,
  ORDER_COMMAND_SERVICE_TOKEN
} from '@terminal-core-lib/features/orders/types/order-command-service.types';

export function provideTerminalOrderCommandService(
  orderCommandService: Type<OrderCommandService>
): Provider[] {
  return [
    OrderInstantTranslatableNotificationsService,
    {
      provide: ORDER_COMMAND_SERVICE_TOKEN,
      useClass: orderCommandService
    },
    OrdersDialogService,
    EvaluationService,
    OrdersGroupService,
    MarginOrderConfirmationService,
    ConfirmableOrderCommandsService,
    OrderDetailsService
  ];
}
