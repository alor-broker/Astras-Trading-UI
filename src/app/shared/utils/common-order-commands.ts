import { Position } from "../models/positions/position.model";
import { OrderService } from "../services/orders/order.service";
import { Side } from "../models/enums/side.model";

export class CommonOrderCommands {
  static closePositionByMarket(
    position: Position,
    instrumentGroup: string | undefined,
    orderService: OrderService
  ): void {
    if (!position.qtyTFutureBatch) {
      return;
    }

    orderService.submitMarketOrder({
        side: position.qtyTFutureBatch > 0 ? Side.Sell : Side.Buy,
        quantity: Math.abs(position.qtyTFutureBatch),
        instrument: {
          symbol: position.symbol,
          exchange: position.exchange,
          instrumentGroup: instrumentGroup
        },
      },
      position.portfolio
    ).subscribe();
  }

  static reversePositionsByMarket(
    position: Position,
    instrumentGroup: string | undefined,
    orderService: OrderService
  ): void {
    if (!position.qtyTFutureBatch) {
      return;
    }

    orderService.submitMarketOrder({
        side: position.qtyTFutureBatch > 0 ? Side.Sell : Side.Buy,
        quantity: Math.abs(position.qtyTFutureBatch * 2),
        instrument: {
          symbol: position.symbol,
          exchange: position.exchange,
          instrumentGroup: instrumentGroup
        },
      },
      position.portfolio
    ).subscribe();
  }
}
