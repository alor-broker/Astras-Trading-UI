import { Injectable } from '@angular/core';
import { CommandBase } from "./command-base";
import { WsOrdersService } from "../../../shared/services/orders/ws-orders.service";
import { OrderType } from "../../../shared/models/orders/order.model";

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
  constructor(private readonly wsOrdersService: WsOrdersService) {
    super();
  }

  execute(args: CancelOrdersCommandArgs): void {
    this.wsOrdersService.cancelOrders(args.ordersToCancel).subscribe();
  }
}
