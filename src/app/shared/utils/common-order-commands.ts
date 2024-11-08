import { Position } from "../models/positions/position.model";
import { Side } from "../models/enums/side.model";
import { WsOrdersService } from "../services/orders/ws-orders.service";

export class CommonOrderCommands {
  static closePositionByMarket(
    position: Position,
    targetInstrumentBoard: string | null,
    wsOrdersService: WsOrdersService
  ): void {
    if (!position.qtyTFutureBatch) {
      return;
    }

    wsOrdersService.submitMarketOrder({
        side: position.qtyTFutureBatch > 0 ? Side.Sell : Side.Buy,
        quantity: Math.abs(position.qtyTFutureBatch),
        instrument: {
          ...position.targetInstrument,
          instrumentGroup: targetInstrumentBoard
        },
      },
      position.ownedPortfolio.portfolio
    ).subscribe();
  }

  static reversePositionsByMarket(
    position: Position,
    targetInstrumentBoard: string | null,
    wsOrdersService: WsOrdersService
  ): void {
    if (!position.qtyTFutureBatch) {
      return;
    }

    wsOrdersService.submitMarketOrder({
        side: position.qtyTFutureBatch > 0 ? Side.Sell : Side.Buy,
        quantity: Math.abs(position.qtyTFutureBatch * 2),
        instrument: {
          ...position.targetInstrument,
          instrumentGroup: targetInstrumentBoard
        },
      },
      position.ownedPortfolio.portfolio
    ).subscribe();
  }
}
