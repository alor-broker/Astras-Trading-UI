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
  profitTriggerPriceRatio: number | null;
  profitLimitPriceGapRatio: number | null;
  lossTriggerPriceRatio: number | null;
  lossLimitPriceGapRatio: number | null;
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
    if (bracketOptions.profitTriggerPriceRatio == null || bracketOptions.profitTriggerPriceRatio === 0) {
      return null;
    }

    return this.buildStopOrder(
      baseOrder,
      () => {
        if (baseOrder.side === Side.Buy) {
          const triggerPrice = this.calculateTriggerPrice(
            basePrice,
            bracketOptions.profitTriggerPriceRatio!,
            priceStep,
            bracketOptions.orderPriceUnits
          );

          return {
            triggerPrice,
            price: this.calculatePriceGap(
              triggerPrice,
              (bracketOptions.profitLimitPriceGapRatio ?? 0) * -1,
              priceStep,
              bracketOptions.orderPriceUnits
            ),
            condition: LessMore.MoreOrEqual
          };
        }

        const triggerPrice = this.calculateTriggerPrice(
          basePrice,
          bracketOptions.profitTriggerPriceRatio! * -1,
          priceStep,
          bracketOptions.orderPriceUnits
        );

        return {
          triggerPrice,
          price: this.calculatePriceGap(
            triggerPrice,
            bracketOptions.profitLimitPriceGapRatio ?? 0,
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
    if (bracketOptions.lossTriggerPriceRatio == null || bracketOptions.lossTriggerPriceRatio === 0) {
      return null;
    }

    return this.buildStopOrder(
      baseOrder,
      () => {
        if (baseOrder.side === Side.Buy) {
          const triggerPrice = this.calculateTriggerPrice(
            basePrice,
            bracketOptions.lossTriggerPriceRatio! * -1,
            priceStep,
            bracketOptions.orderPriceUnits
          );

          return {
            triggerPrice,
            price: this.calculatePriceGap(
              triggerPrice,
              (bracketOptions.lossLimitPriceGapRatio ?? 0) * -1,
              priceStep,
              bracketOptions.orderPriceUnits
            ),
            condition: LessMore.LessOrEqual
          };
        }

        const triggerPrice = this.calculateTriggerPrice(
          basePrice,
          bracketOptions.lossTriggerPriceRatio!,
          priceStep,
          bracketOptions.orderPriceUnits
        );

        return {
          triggerPrice,
          price: this.calculatePriceGap(
            triggerPrice,
            bracketOptions.lossLimitPriceGapRatio ?? 0,
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

  protected calculatePriceGap(
    triggerPrice: number,
    gap: number,
    priceStep: number,
    priceUnits: PriceUnits
  ): number {
    if (priceUnits === PriceUnits.Points) {
      return MathHelper.roundPrice(
        triggerPrice + (gap * priceStep),
        priceStep
      );
    }

    return MathHelper.roundPrice(
      triggerPrice * (1 + (gap / 100)),
      priceStep
    );
  }

  private buildStopOrder(
    baseOrder: NewOrderBase,
    optionsCalc: () => ({ triggerPrice: number, price: number, condition: LessMore })): NewStopLimitOrder {
    const options = optionsCalc();

    return {
      instrument: baseOrder.instrument,
      side: baseOrder.side === Side.Buy
        ? Side.Sell
        : Side.Buy,
      quantity: baseOrder.quantity,
      triggerPrice: options.triggerPrice,
      condition: options.condition,
      price: options.price,
      activate: false
    };
  }
}
