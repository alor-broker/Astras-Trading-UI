import { Injectable } from '@angular/core';
import { InstrumentKey } from "../../../shared/models/instruments/instrument-key.model";
import { Side } from "../../../shared/models/enums/side.model";
import { CommandBase } from "./command-base";
import { WsOrdersService } from "../../../shared/services/orders/ws-orders.service";
import { OrdersDialogService } from "../../../shared/services/orders/orders-dialog.service";
import { NewMarketOrder } from "../../../shared/models/orders/new-order.model";
import { toInstrumentKey } from "../../../shared/utils/instruments";
import { OrderFormType } from "../../../shared/models/orders/orders-dialog.model";

export interface SubmitMarketOrderCommandArgs {
  instrumentKey: InstrumentKey;
  side: Side;
  quantity: number;
  targetPortfolio: string;
  silent: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SubmitMarketOrderCommand extends CommandBase<SubmitMarketOrderCommandArgs> {
  constructor(
    private readonly wsOrdersService: WsOrdersService,
    private readonly ordersDialogService: OrdersDialogService
  ) {
    super();
  }

  execute(args: SubmitMarketOrderCommandArgs): void {
    const order: NewMarketOrder = {
      instrument: toInstrumentKey(args.instrumentKey),
      side: args.side,
      quantity: args.quantity,
    };

    if (args.silent) {
      this.wsOrdersService.submitMarketOrder(order, args.targetPortfolio).subscribe();
    } else {
      this.ordersDialogService.openNewOrderDialog({
        instrumentKey: toInstrumentKey(order.instrument),
        initialValues: {
          orderType: OrderFormType.Market,
          quantity: order.quantity
        }
      });
    }
  }
}
