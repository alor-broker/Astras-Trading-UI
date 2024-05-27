import { Injectable } from '@angular/core';
import { CurrentOrderDisplay } from "../models/scalper-order-book.model";
import { CommandBase } from "./command-base";
import { WsOrdersService } from "../../../shared/services/orders/ws-orders.service";
import { OrdersDialogService } from "../../../shared/services/orders/orders-dialog.service";
import { OrderType } from "../../../shared/models/orders/order.model";
import { MathHelper } from "../../../shared/utils/math-helper";
import { OrderFormType } from "../../../shared/models/orders/orders-dialog.model";

export interface UpdateOrdersCommandArgs {
  ordersToUpdate: CurrentOrderDisplay[];
  updates: { price: number };
  silent: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class UpdateOrdersCommand extends CommandBase<UpdateOrdersCommandArgs> {
  constructor(
    private readonly wsOrdersService: WsOrdersService,
    private readonly ordersDialogService: OrdersDialogService
  ) {
    super();
  }

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
          instrument: {
            symbol: order.symbol,
            exchange: order.exchange
          }
        };

        switch (order.type) {
          case OrderType.Limit:
            this.wsOrdersService.submitLimitOrderEdit({
                ...baseOrderEditData,
                price: args.updates.price,
              },
              order.portfolio
            ).subscribe();
            break;
          case OrderType.StopLimit:
            this.wsOrdersService.submitStopLimitOrderEdit({
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
              order.portfolio
            ).subscribe();
            break;
          case OrderType.StopMarket:
            this.wsOrdersService.submitStopMarketOrderEdit({
                ...baseOrderEditData,
                condition: order.condition!,
                triggerPrice: args.updates.price,
                side: order.side
              },
              order.portfolio
            ).subscribe();
            break;
          default:
            return;
        }
      }
    } else {
      const order = args.ordersToUpdate[0];
      this.ordersDialogService.openEditOrderDialog({
        instrumentKey: {
          symbol: order.symbol,
          exchange: order.exchange
        },
        portfolioKey: {
          portfolio: order.portfolio,
          exchange: order.exchange
        },
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
