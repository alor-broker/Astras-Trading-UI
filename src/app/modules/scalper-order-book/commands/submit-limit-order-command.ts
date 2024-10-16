import { Injectable } from '@angular/core';
import { Position } from "../../../shared/models/positions/position.model";
import { InstrumentKey } from "../../../shared/models/instruments/instrument-key.model";
import { Side } from "../../../shared/models/enums/side.model";
import { CommandBase } from "./command-base";
import { OrdersDialogService } from "../../../shared/services/orders/orders-dialog.service";
import {
  NewLimitOrder,
  NewLinkedOrder,
  NewStopLimitOrder
} from "../../../shared/models/orders/new-order.model";
import { toInstrumentKey } from "../../../shared/utils/instruments";
import { PriceUnits } from "../models/scalper-order-book-settings.model";
import { OrderType } from "../../../shared/models/orders/order.model";
import { ExecutionPolicy } from "../../../shared/models/orders/orders-group.model";
import {
  OrderDialogParams,
  OrderFormType
} from "../../../shared/models/orders/orders-dialog.model";
import { MathHelper } from "../../../shared/utils/math-helper";
import { LessMore } from "../../../shared/models/enums/less-more.model";
import { GuidGenerator } from "../../../shared/utils/guid";
import { take } from "rxjs";
import { LocalOrderTracker } from "./local-order-tracker";
import { OrderCommandService } from "../../../shared/services/orders/order-command.service";

export interface LimitOrderTracker extends LocalOrderTracker<NewLimitOrder> {
  beforeOrderCreated: (order: NewLimitOrder) => void;
  orderProcessed: (localId: string, isSuccess: boolean) => void;
}

export interface BracketOptions {
  profitPriceRatio: number | null;
  lossPriceRatio: number | null;
  orderPriceUnits: PriceUnits;
  applyBracketOnClosing: boolean;
  currentPosition: Position | null;
}

export interface SubmitLimitOrderCommandArgs {
  instrumentKey: InstrumentKey;
  side: Side;
  quantity: number;
  price: number;
  targetPortfolio: string;
  bracketOptions: BracketOptions | null;
  priceStep: number;
  silent: boolean;
  orderTracker?: LimitOrderTracker;
}

@Injectable({
  providedIn: 'root'
})
export class SubmitLimitOrderCommand extends CommandBase<SubmitLimitOrderCommandArgs> {
  constructor(
    private readonly orderCommandService: OrderCommandService,
    private readonly ordersDialogService: OrdersDialogService
  ) {
    super();
  }

  execute(args: SubmitLimitOrderCommandArgs): void {
    const limitOrder = this.prepareLimitOrder(args);

    let getProfitOrder: NewStopLimitOrder | null = null;
    let stopLossOrder: NewStopLimitOrder | null = null;

    const shouldApplyBracket = args.bracketOptions != null
      && (
        !this.isClosingPosition(limitOrder, args.bracketOptions.currentPosition)
        || (args.bracketOptions?.applyBracketOnClosing ?? false)
      );

    if (shouldApplyBracket) {
      getProfitOrder = this.prepareGetProfitOrder(limitOrder, args.bracketOptions!, args.priceStep);
      stopLossOrder = this.prepareStopLossOrder(limitOrder, args.bracketOptions!, args.priceStep);
    }

    if (args.silent) {
      this.submitOrderSilent(
        limitOrder,
        getProfitOrder,
        stopLossOrder,
        args
      );
    } else {
      this.openOrderDialog(limitOrder, getProfitOrder, stopLossOrder);
    }
  }

  protected prepareLimitOrder(args: SubmitLimitOrderCommandArgs): NewLimitOrder {
    return {
      instrument: toInstrumentKey(args.instrumentKey),
      price: args.price,
      quantity: args.quantity,
      side: args.side,
      meta: {
        trackId: GuidGenerator.newGuid()
      }
    };
  }

  protected isClosingPosition(limitOrder: NewLimitOrder, currentPosition: Position | null): boolean {
    if (currentPosition == null) {
      return false;
    }

    const currentQtyMod = Math.abs(currentPosition.qtyTFutureBatch);
    const changedQtyMod = limitOrder.side === Side.Sell
      ? Math.abs(currentPosition.qtyTFutureBatch - limitOrder.quantity)
      : Math.abs(currentPosition.qtyTFutureBatch + limitOrder.quantity);

    return changedQtyMod < currentQtyMod;
  }

  protected prepareGetProfitOrder(
    limitOrder: NewLimitOrder,
    bracketOptions: BracketOptions,
    priceStep: number
  ): NewStopLimitOrder | null {
    if (bracketOptions.profitPriceRatio == null || bracketOptions.profitPriceRatio === 0) {
      return null;
    }

    return this.buildStopOrder(
      limitOrder,
      () => {
        if (limitOrder.side === Side.Buy) {
          return {
            triggerPrice: this.calculateTriggerPrice(
              limitOrder.price,
              bracketOptions.profitPriceRatio!,
              priceStep,
              bracketOptions.orderPriceUnits
            ),
            condition: LessMore.MoreOrEqual
          };
        }

        return {
          triggerPrice: this.calculateTriggerPrice(
            limitOrder.price,
            bracketOptions.profitPriceRatio! * -1,
            priceStep,
            bracketOptions.orderPriceUnits
          ),
          condition: LessMore.LessOrEqual
        };
      }
    );
  }

  protected prepareStopLossOrder(
    limitOrder: NewLimitOrder,
    bracketOptions: BracketOptions,
    priceStep: number
  ): NewStopLimitOrder | null {
    if (bracketOptions.lossPriceRatio == null || bracketOptions.lossPriceRatio === 0) {
      return null;
    }

    return this.buildStopOrder(
      limitOrder,
      () => {
        if (limitOrder.side === Side.Buy) {
          return {
            triggerPrice: this.calculateTriggerPrice(
              limitOrder.price,
              bracketOptions.lossPriceRatio! * -1,
              priceStep,
              bracketOptions.orderPriceUnits
            ),
            condition: LessMore.LessOrEqual
          };
        }

        return {
          triggerPrice: this.calculateTriggerPrice(
            limitOrder.price,
            bracketOptions.lossPriceRatio!,
            priceStep,
            bracketOptions.orderPriceUnits
          ),
          condition: LessMore.MoreOrEqual
        };
      }
    );
  }

  protected calculateTriggerPrice(
    basePrice: number,
    priceRatio: number,
    priceStep: number,
    priceUnits: PriceUnits
  ): number {
    if (priceUnits === PriceUnits.Points) {
      return MathHelper.roundPrice(
        basePrice + (priceRatio * priceStep),
        priceStep
      );
    }

    return MathHelper.roundPrice(
      basePrice * (1 + (priceRatio / 100)),
      priceStep
    );
  }

  private buildStopOrder(
    limitOrder: NewLimitOrder,
    optionsCalc: () => ({ triggerPrice: number, condition: LessMore })): NewStopLimitOrder {
    const options = optionsCalc();

    return {
      instrument: limitOrder.instrument,
      side: limitOrder.side === Side.Buy
        ? Side.Sell
        : Side.Buy,
      quantity: limitOrder.quantity,
      triggerPrice: options.triggerPrice,
      condition: options.condition,
      price: limitOrder.price,
      activate: false
    };
  }

  private openOrderDialog(
    limitOrder: NewLimitOrder,
    getProfitOrder: NewStopLimitOrder | null,
    stopLossOrder: NewStopLimitOrder | null
  ): void {
    const dialogParams: OrderDialogParams = {
      instrumentKey: limitOrder.instrument,
      initialValues: {
        orderType: OrderFormType.Limit,
        quantity: limitOrder.quantity,
        price: limitOrder.price,
        bracket: {}
      }
    };

    const stopOrders = [
      getProfitOrder,
      stopLossOrder
    ].filter((o): o is NewStopLimitOrder => !!o);

    const moreOrEqualOrder = stopOrders.find(o => o.condition === LessMore.MoreOrEqual);
    const lessOrEqualOrder = stopOrders.find(o => o.condition === LessMore.LessOrEqual);

    if (moreOrEqualOrder != null) {
      dialogParams.initialValues.bracket!.topOrderPrice = moreOrEqualOrder.triggerPrice;
      dialogParams.initialValues.bracket!.topOrderSide = moreOrEqualOrder.side;
    }

    if (lessOrEqualOrder != null) {
      dialogParams.initialValues.bracket!.bottomOrderPrice = lessOrEqualOrder.triggerPrice;
      dialogParams.initialValues.bracket!.bottomOrderSide = lessOrEqualOrder.side;
    }

    this.ordersDialogService.openNewOrderDialog(dialogParams);
  }

  private submitOrderSilent(
    limitOrder: NewLimitOrder,
    getProfitOrder: NewStopLimitOrder | null,
    stopLossOrder: NewStopLimitOrder | null,
    args: SubmitLimitOrderCommandArgs
  ): void {
    args.orderTracker?.beforeOrderCreated(limitOrder);

    if (getProfitOrder != null || stopLossOrder != null) {
      const orders: NewLinkedOrder[] = [
        {
          ...limitOrder,
          type: OrderType.Limit
        }
      ];

      if (getProfitOrder != null) {
        orders.push({
          ...getProfitOrder,
          type: OrderType.StopLimit
        });
      }

      if (stopLossOrder != null) {
        orders.push({
          ...stopLossOrder,
          type: OrderType.StopLimit
        });
      }

      this.orderCommandService.submitOrdersGroup(orders, args.targetPortfolio, ExecutionPolicy.TriggerBracketOrders).pipe(
        take(1)
      ).subscribe(result => {
        if (limitOrder.meta?.trackId != null) {
          args.orderTracker?.orderProcessed(limitOrder.meta.trackId, result != null);
        }
      });
    } else {
      this.orderCommandService.submitLimitOrder(limitOrder, args.targetPortfolio).pipe(
        take(1)
      ).subscribe(result => {
        if (limitOrder.meta?.trackId != null) {
          args.orderTracker?.orderProcessed(limitOrder.meta.trackId, result.isSuccess);
        }
      });
    }
  }
}
