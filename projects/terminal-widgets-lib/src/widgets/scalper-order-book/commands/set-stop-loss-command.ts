import {
  inject,
  Injectable
} from '@angular/core';
import {CommandBase} from "./command-base";
import {ScalperOrderBookInstantTranslatableNotificationsService} from "../services/scalper-order-book-instant-translatable-notifications.service";
import {take} from "rxjs";
import {LocalOrderTracker} from '@terminal-widgets-lib/widgets/scalper-order-book/commands/local-order-tracker';
import {NewStopMarketOrder} from '@terminal-core-lib/features/orders/types/new-order.types';
import {ORDER_COMMAND_SERVICE_TOKEN} from '@terminal-core-lib/features/orders/types/order-command-service.types';
import {OrdersDialogService} from '@terminal-core-lib/features/orders/services/orders-dialog.service';
import {Side} from '@terminal-core-lib/common/types/side.types';
import {GuidGenerator} from '@terminal-core-lib/common/utils/guid-generator';
import {Condition} from '@terminal-core-lib/common/types/condition.types';
import {OrderFormType} from '@terminal-core-lib/features/orders/services/orders-dialog-service.types';
import {Position} from '@terminal-core-lib/features/portfolios/types/position.types';

export interface StopMarketOrderTracker extends LocalOrderTracker<NewStopMarketOrder> {
  beforeOrderCreated: (order: NewStopMarketOrder) => void;
  orderProcessed: (localId: string, isSuccess: boolean) => void;
}

export interface SetStopLossCommandArgs {
  currentPosition: Position | null;
  targetInstrumentBoard: string | null;
  triggerPrice: number;
  silent: boolean;
  orderTracker?: StopMarketOrderTracker;
  allowMargin?: boolean;
}

@Injectable()
export class SetStopLossCommand extends CommandBase<SetStopLossCommandArgs> {
  private readonly orderCommandService = inject(ORDER_COMMAND_SERVICE_TOKEN);

  private readonly ordersDialogService = inject(OrdersDialogService);

  private readonly notification = inject(ScalperOrderBookInstantTranslatableNotificationsService);

  execute(args: SetStopLossCommandArgs): void {
    if (args.currentPosition == null || args.currentPosition.qtyTFutureBatch === 0 || !args.currentPosition.avgPrice) {
      this.notification.emptyPositions();
      return;
    }

    const side = args.currentPosition.qtyTFutureBatch < 0 ? Side.Buy : Side.Sell;

    const order: NewStopMarketOrder = {
      side: side,
      quantity: Math.abs(args.currentPosition.qtyTFutureBatch),
      instrument: {
        symbol: args.currentPosition.targetInstrument.symbol,
        exchange: args.currentPosition.targetInstrument.exchange,
        instrumentGroup: args.targetInstrumentBoard
      },
      triggerPrice: args.triggerPrice,
      condition: side === Side.Sell ? Condition.LessOrEqual : Condition.MoreOrEqual,
      meta: {
        trackId: GuidGenerator.newGuid()
      },
      allowMargin: args.allowMargin
    };

    if (args.silent) {
      args.orderTracker?.beforeOrderCreated(order);

      this.orderCommandService.submitStopMarketOrder(order, args.currentPosition.ownedPortfolio.portfolio).pipe(
        take(1)
      ).subscribe(result => {
        if (order.meta?.trackId != null) {
          args.orderTracker?.orderProcessed(order.meta.trackId, result.isSuccess);
        }
      });
    } else {
      this.ordersDialogService.openNewOrderDialog({
        instrumentKey: order.instrument,
        initialValues: {
          orderType: OrderFormType.Stop,
          quantity: order.quantity,
          stopOrder: {
            limit: false,
            triggerPrice: order.triggerPrice,
            condition: order.condition,
            disableCalculations: true
          }
        }
      });
    }
  }
}
