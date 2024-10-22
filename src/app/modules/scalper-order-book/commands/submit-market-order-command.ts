import {
  Inject,
  Injectable
} from '@angular/core';
import { InstrumentKey } from "../../../shared/models/instruments/instrument-key.model";
import { Side } from "../../../shared/models/enums/side.model";
import { CommandBase } from "./command-base";
import { OrdersDialogService } from "../../../shared/services/orders/orders-dialog.service";
import { NewMarketOrder } from "../../../shared/models/orders/new-order.model";
import { toInstrumentKey } from "../../../shared/utils/instruments";
import { OrderFormType } from "../../../shared/models/orders/orders-dialog.model";
import {
  ORDER_COMMAND_SERVICE_TOKEN,
  OrderCommandService
} from "../../../shared/services/orders/order-command.service";

export interface SubmitMarketOrderCommandArgs {
  instrumentKey: InstrumentKey;
  side: Side;
  quantity: number;
  targetPortfolio: string;
  silent: boolean;
}

@Injectable()
export class SubmitMarketOrderCommand extends CommandBase<SubmitMarketOrderCommandArgs> {
  constructor(
    @Inject(ORDER_COMMAND_SERVICE_TOKEN)
    private readonly orderCommandService: OrderCommandService,
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
      this.orderCommandService.submitMarketOrder(order, args.targetPortfolio).subscribe();
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
