import {
  inject,
  Injectable
} from '@angular/core';
import {take} from "rxjs";
import {LocalOrderTracker} from '@terminal-widgets-lib/widgets/scalper-order-book/commands/local-order-tracker';
import {NewStopLimitOrder} from '@terminal-core-lib/features/orders/types/new-order.types';
import {InstrumentKey} from '@terminal-core-lib/common/types/instrument.types';
import {Side} from '@terminal-core-lib/common/types/side.types';
import {CommandBase} from '@terminal-widgets-lib/widgets/scalper-order-book/commands/command-base';
import {ORDER_COMMAND_SERVICE_TOKEN} from '@terminal-core-lib/features/orders/types/order-command-service.types';
import {OrdersDialogService} from '@terminal-core-lib/features/orders/services/orders-dialog.service';
import {MathHelper} from '@terminal-core-lib/common/utils/math.helper';
import {InstrumentKeyHelper} from '@terminal-core-lib/common/utils/instrument-key.helper';
import {GuidGenerator} from '@terminal-core-lib/common/utils/guid-generator';
import {Condition} from '@terminal-core-lib/common/types/condition.types';
import {OrderFormType} from '@terminal-core-lib/features/orders/services/orders-dialog-service.types';

export interface StopLimitOrderTracker extends LocalOrderTracker<NewStopLimitOrder> {
  beforeOrderCreated: (order: NewStopLimitOrder) => void;
  orderProcessed: (localId: string, isSuccess: boolean) => void;
}

export interface SubmitStopLimitOrderCommandArgs {
  instrumentKey: InstrumentKey;
  side: Side;
  triggerPrice: number;
  priceOptions?: {
    distance: number;
    priceStep: number;
  };
  quantity: number;
  targetPortfolio: string;
  silent: boolean;
  orderTracker?: StopLimitOrderTracker;
  allowMargin?: boolean;
}

@Injectable()
export class SubmitStopLimitOrderCommand extends CommandBase<SubmitStopLimitOrderCommandArgs> {
  private readonly orderCommandService = inject(ORDER_COMMAND_SERVICE_TOKEN);

  private readonly ordersDialogService = inject(OrdersDialogService);

  execute(args: SubmitStopLimitOrderCommandArgs): void {
    let orderPrice = args.triggerPrice;

    if (args.priceOptions != null) {
      orderPrice = args.side === Side.Sell
        ? MathHelper.roundPrice(orderPrice - args.priceOptions.distance * args.priceOptions.priceStep, args.priceOptions.priceStep)
        : MathHelper.roundPrice(orderPrice + args.priceOptions.distance * args.priceOptions.priceStep, args.priceOptions.priceStep);
    }

    const order: NewStopLimitOrder = {
      instrument: InstrumentKeyHelper.toInstrumentKey(args.instrumentKey),
      side: args.side,
      quantity: args.quantity,
      triggerPrice: args.triggerPrice,
      price: orderPrice,
      condition: args.side === Side.Buy ? Condition.MoreOrEqual : Condition.LessOrEqual,
      meta: {
        trackId: GuidGenerator.newGuid()
      },
      allowMargin: args.allowMargin
    };

    if (args.silent) {
      args.orderTracker?.beforeOrderCreated(order);

      this.orderCommandService.submitStopLimitOrder(order, args.targetPortfolio).pipe(
        take(1)
      ).subscribe(result => {
        if (order.meta?.trackId != null) {
          args.orderTracker?.orderProcessed(order.meta.trackId, result.isSuccess);
        }
      });
    } else {
      this.ordersDialogService.openNewOrderDialog({
        instrumentKey: InstrumentKeyHelper.toInstrumentKey(order.instrument),
        initialValues: {
          orderType: OrderFormType.Stop,
          price: order.price,
          quantity: order.quantity,
          stopOrder: {
            triggerPrice: order.triggerPrice,
            condition: order.condition,
            limit: true,
            disableCalculations: true
          }
        }
      });
    }
  }
}
