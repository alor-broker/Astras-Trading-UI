import {
  Inject,
  Injectable
} from '@angular/core';
import { CommandBase } from "./command-base";
import { OrderType } from "../../../shared/models/orders/order.model";
import {
  ORDER_COMMAND_SERVICE_TOKEN,
  OrderCommandService
} from "../../../shared/services/orders/order-command.service";

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
  constructor(
    @Inject(ORDER_COMMAND_SERVICE_TOKEN)
    private readonly orderCommandService: OrderCommandService
  ) {
    super();
  }

  execute(args: CancelOrdersCommandArgs): void {
    this.orderCommandService.cancelOrders(args.ordersToCancel).subscribe();
  }
}
