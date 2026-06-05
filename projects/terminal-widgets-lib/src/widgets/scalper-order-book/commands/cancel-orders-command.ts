import {
  inject,
  Injectable
} from '@angular/core';
import {CommandBase} from "./command-base";
import {OrderType} from '@terminal-core-lib/features/orders/types/orders.types';
import {ORDER_COMMAND_SERVICE_TOKEN} from '@terminal-core-lib/features/orders/types/order-command-service.types';
import {take} from 'rxjs';

export interface CancelOrdersCommandArgs {
  ordersToCancel: {
    orderId: string;
    portfolio: string;
    exchange: string;
    orderType: OrderType;
  }[];
}

@Injectable()
export class CancelOrdersCommand extends CommandBase<CancelOrdersCommandArgs> {
  private readonly orderCommandService = inject(ORDER_COMMAND_SERVICE_TOKEN);

  execute(args: CancelOrdersCommandArgs): void {
    this.orderCommandService.cancelOrders(args.ordersToCancel).pipe(
      take(1)
    ).subscribe();
  }
}
