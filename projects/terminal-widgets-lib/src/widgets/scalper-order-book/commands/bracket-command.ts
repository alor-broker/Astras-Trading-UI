import {CommandBase} from "./command-base";
import {PriceUnits} from '@terminal-widgets-lib/widgets/scalper-order-book/widget-settings.types';
import {Position} from '@terminal-core-lib/features/portfolios/types/position.types';
import {
  NewOrderBase,
  NewStopLimitOrder
} from '@terminal-core-lib/features/orders/types/new-order.types';
import {Side} from '@terminal-core-lib/common/types/side.types';
import {Condition} from '@terminal-core-lib/common/types/condition.types';
import {MathHelper} from '@terminal-core-lib/common/utils/math.helper';

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
            condition: Condition.MoreOrEqual
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
          condition: Condition.LessOrEqual
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
            condition: Condition.LessOrEqual
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
          condition: Condition.MoreOrEqual
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
    optionsCalc: () => ({ triggerPrice: number, price: number, condition: Condition })): NewStopLimitOrder {
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
