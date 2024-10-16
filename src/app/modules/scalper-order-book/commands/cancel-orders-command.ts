import { Injectable } from '@angular/core';
import { CommandBase } from "./command-base";
import { OrderType } from "../../../shared/models/orders/order.model";
import { OrderCommandService } from "../../../shared/services/orders/order-command.service";

export interface CancelOrdersCommandArgs {
  ordersToCancel: {
    orderId: string;
    portfolio: string;
    exchange: string;
    orderType: OrderType;
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class CancelOrdersCommand extends CommandBase<CancelOrdersCommandArgs> {
  constructor(private readonly orderCommandService: OrderCommandService) {
    super();
  }

  execute(args: CancelOrdersCommandArgs): void {
    this.orderCommandService.cancelOrders(args.ordersToCancel).subscribe();
  }
}
