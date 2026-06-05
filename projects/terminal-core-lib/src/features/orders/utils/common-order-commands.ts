import {OrderCommandService} from '../types/order-command-service.types';
import {Side} from '../../../common/types/side.types';
import {Position} from '@terminal-core-lib/features/portfolios/types/position.types';
import {take} from 'rxjs';

export class CommonOrderCommands {
  static closePositionByMarket(
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
        quantity: Math.abs(position.qtyTFutureBatch),
        instrument: {
          ...position.targetInstrument,
          instrumentGroup: targetInstrumentBoard
        },
        allowMargin
      },
      position.ownedPortfolio.portfolio
    ).pipe(
      take(1)
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
    ).pipe(
      take(1)
    ).subscribe();
  }
}
