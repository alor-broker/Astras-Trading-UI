import {
  inject,
  Injectable
} from '@angular/core';
import {CommandBase} from "./command-base";
import {CurrentOrderDisplay} from "../types/scalper-order-book.types";
import {ORDER_COMMAND_SERVICE_TOKEN} from '@terminal-core-lib/features/orders/types/order-command-service.types';
import {OrdersDialogService} from '@terminal-core-lib/features/orders/services/orders-dialog.service';
import {OrderType} from '@terminal-core-lib/features/orders/types/orders.types';
import {MathHelper} from '@terminal-core-lib/common/utils/math.helper';
import {OrderFormType} from '@terminal-core-lib/features/orders/services/orders-dialog-service.types';
import {take} from 'rxjs';

export interface UpdateOrdersCommandArgs {
  ordersToUpdate: CurrentOrderDisplay[];
  updates: { price: number };
  silent: boolean;
  allowMargin?: boolean;
}

@Injectable()
export class UpdateOrdersCommand extends CommandBase<UpdateOrdersCommandArgs> {
  private readonly orderCommandService = inject(ORDER_COMMAND_SERVICE_TOKEN);

  private readonly ordersDialogService = inject(OrdersDialogService);

  execute(args: UpdateOrdersCommandArgs): void {
    if (args.ordersToUpdate.length === 0) {
      return;
    }

    if (args.silent) {
      for (const order of args.ordersToUpdate) {
        const baseOrderEditData = {
          orderId: order.orderId,
          side: order.side,
          quantity: order.displayVolume,
          instrument: order.targetInstrument,
          allowMargin: args.allowMargin
        };

        switch (order.type) {
          case OrderType.Limit:
            this.orderCommandService.submitLimitOrderEdit({
                ...baseOrderEditData,
                price: args.updates.price,
              },
              order.ownedPortfolio.portfolio
            ).pipe(
              take(1)
            ).subscribe();
            break;
          case OrderType.StopLimit:
            this.orderCommandService.submitStopLimitOrderEdit({
                ...baseOrderEditData,
                condition: order.condition!,
                triggerPrice: args.updates.price,
                price: MathHelper.round(
                  order.price! - (order.triggerPrice! - args.updates.price),
                  Math.max(
                    MathHelper.getPrecision(order.price!),
                    MathHelper.getPrecision(order.triggerPrice!),
                    MathHelper.getPrecision(args.updates.price)
                  )
                ),
                side: order.side
              },
              order.ownedPortfolio.portfolio
            ).pipe(
              take(1)
            ).subscribe();
            break;
          case OrderType.StopMarket:
            this.orderCommandService.submitStopMarketOrderEdit({
                ...baseOrderEditData,
                condition: order.condition!,
                triggerPrice: args.updates.price,
                side: order.side
              },
              order.ownedPortfolio.portfolio
            ).pipe(
              take(1)
            ).subscribe();
            break;
          default:
            return;
        }
      }
    } else {
      const order = args.ordersToUpdate[0];
      this.ordersDialogService.openEditOrderDialog({
        instrumentKey: order.targetInstrument,
        portfolioKey: order.ownedPortfolio,
        orderId: order.orderId,
        orderType: order.type === OrderType.Limit ? OrderFormType.Limit : OrderFormType.Stop,
        initialValues: {
          quantity: order.displayVolume,
          price: order.type === OrderType.Limit
            ? args.updates.price
            : MathHelper.round(
              (order.price ?? 0) - (order.triggerPrice! - args.updates.price),
              Math.max(
                MathHelper.getPrecision(order.price ?? 0),
                MathHelper.getPrecision(order.triggerPrice!),
                MathHelper.getPrecision(args.updates.price)
              )
            ),
          triggerPrice: args.updates.price,
          hasPriceChanged: true
        }
      });
    }
  }
}
