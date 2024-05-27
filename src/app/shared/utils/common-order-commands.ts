import { Position } from "../models/positions/position.model";
import { Side } from "../models/enums/side.model";
import { WsOrdersService } from "../services/orders/ws-orders.service";

export class CommonOrderCommands {
  static closePositionByMarket(
    position: Position,
    instrumentGroup: string | null,
    wsOrdersService: WsOrdersService
  ): void {
    if (!position.qtyTFutureBatch) {
      return;
    }

    wsOrdersService.submitMarketOrder({
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
    instrumentGroup: string | null,
    wsOrdersService: WsOrdersService
  ): void {
    if (!position.qtyTFutureBatch) {
      return;
    }

    wsOrdersService.submitMarketOrder({
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
