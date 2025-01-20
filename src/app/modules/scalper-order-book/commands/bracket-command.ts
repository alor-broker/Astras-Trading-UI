import { PriceUnits } from "../models/scalper-order-book-settings.model";
import { Position } from "../../../shared/models/positions/position.model";
import { CommandBase } from "./command-base";
import {
  NewOrderBase,
  NewStopLimitOrder
} from "../../../shared/models/orders/new-order.model";
import { Side } from "../../../shared/models/enums/side.model";
import { LessMore } from "../../../shared/models/enums/less-more.model";
import { MathHelper } from "../../../shared/utils/math-helper";

export interface BracketOptions {
  profitPriceRatio: number | null;
  lossPriceRatio: number | null;
  orderPriceUnits: PriceUnits;
  applyBracketOnClosing: boolean;
  currentPosition: Position | null;
}

export abstract class BracketCommand<T> extends CommandBase<T> {
  protected isClosingPosition(order: NewOrderBase, currentPosition: Position | null): boolean {
    if (currentPosition == null) {
      return false;
    }

    const currentQtyMod = Math.abs(currentPosition.qtyTFutureBatch);
    const changedQtyMod = order.side === Side.Sell
      ? Math.abs(currentPosition.qtyTFutureBatch - order.quantity)
      : Math.abs(currentPosition.qtyTFutureBatch + order.quantity);

    return changedQtyMod < currentQtyMod;
  }

  protected shouldApplyBracket(bracketOptions: BracketOptions | null, order: NewOrderBase): boolean {
    return bracketOptions != null
      && (
        !this.isClosingPosition(order, bracketOptions.currentPosition)
        || (bracketOptions.applyBracketOnClosing ?? false)
      );
  }

  protected prepareGetProfitOrder(
    baseOrder: NewOrderBase,
    basePrice: number,
    bracketOptions: BracketOptions,
    priceStep: number
  ): NewStopLimitOrder | null {
    if (bracketOptions.profitPriceRatio == null || bracketOptions.profitPriceRatio === 0) {
      return null;
    }

    return this.buildStopOrder(
      baseOrder,
      basePrice,
      () => {
        if (baseOrder.side === Side.Buy) {
          return {
            triggerPrice: this.calculateTriggerPrice(
              basePrice,
              bracketOptions.profitPriceRatio!,
              priceStep,
              bracketOptions.orderPriceUnits
            ),
            condition: LessMore.MoreOrEqual
          };
        }

        return {
          triggerPrice: this.calculateTriggerPrice(
            basePrice,
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
    baseOrder: NewOrderBase,
    basePrice: number,
    bracketOptions: BracketOptions,
    priceStep: number
  ): NewStopLimitOrder | null {
    if (bracketOptions.lossPriceRatio == null || bracketOptions.lossPriceRatio === 0) {
      return null;
    }

    return this.buildStopOrder(
      baseOrder,
      basePrice,
      () => {
        if (baseOrder.side === Side.Buy) {
          return {
            triggerPrice: this.calculateTriggerPrice(
              basePrice,
              bracketOptions.lossPriceRatio! * -1,
              priceStep,
              bracketOptions.orderPriceUnits
            ),
            condition: LessMore.LessOrEqual
          };
        }

        return {
          triggerPrice: this.calculateTriggerPrice(
            basePrice,
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
    baseOrder: NewOrderBase,
    basePrice: number,
    optionsCalc: () => ({ triggerPrice: number, condition: LessMore })): NewStopLimitOrder {
    const options = optionsCalc();

    return {
      instrument: baseOrder.instrument,
      side: baseOrder.side === Side.Buy
        ? Side.Sell
        : Side.Buy,
      quantity: baseOrder.quantity,
      triggerPrice: options.triggerPrice,
      condition: options.condition,
      price: basePrice,
      activate: false
    };
  }
}
