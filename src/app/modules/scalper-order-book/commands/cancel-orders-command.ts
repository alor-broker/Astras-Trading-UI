import { Injectable, inject } from '@angular/core';
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
  private readonly orderCommandService = inject<OrderCommandService>(ORDER_COMMAND_SERVICE_TOKEN);

  execute(args: CancelOrdersCommandArgs): void {
    this.orderCommandService.cancelOrders(args.ordersToCancel).subscribe();
  }
}
