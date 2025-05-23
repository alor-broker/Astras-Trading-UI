import { Position } from "../models/positions/position.model";
import { Side } from "../models/enums/side.model";
import { OrderCommandService } from "../services/orders/order-command.service";

export class CommonOrderCommands {
  static closePositionByMarket(
    position: Position,
    targetInstrumentBoard: string | null,
    orderCommandService: OrderCommandService
  ): void {
    if ((position.qtyTFutureBatch ?? 0) === 0) {
      return;
    }
    orderCommandService.submitMarketOrder({
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
    orderCommandService: OrderCommandService,
    allowMargin?: boolean
  ): void {
    if ((position.qtyTFutureBatch ?? 0) === 0) {
      return;
    }

    orderCommandService.submitMarketOrder({
        side: position.qtyTFutureBatch > 0 ? Side.Sell : Side.Buy,
        quantity: Math.abs(position.qtyTFutureBatch * 2),
        instrument: {
          ...position.targetInstrument,
          instrumentGroup: targetInstrumentBoard
        },
        allowMargin
      },
      position.ownedPortfolio.portfolio
    ).subscribe();
  }
}
