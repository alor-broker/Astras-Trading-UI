import {Trade} from '@terminal-core-lib/features/portfolios/types/trade.types';
import {Position} from '@terminal-core-lib/features/portfolios/types/position.types';
import {Side} from '@terminal-core-lib/common/types/side.types';
import {OwnTradeDisplay} from '@terminal-widgets-lib/widgets/scalper-order-book-2/render/render-contracts';

/**
 * Отбор собственных сделок, относящихся к текущей открытой позиции.
 * Повторяет логику панели сделок scalper-order-book: сделки перебираются
 * от новых к старым, пока их суммарный объем не покроет объем позиции.
 */
export class OwnTradesHelper {
  static filterTradesByPosition(trades: Trade[], position: Position | null): OwnTradeDisplay[] {
    if (position == null) {
      return [];
    }

    const sortedTrades = [...trades].sort((a, b) => b.date.getTime() - a.date.getTime());
    const filteredTrades: OwnTradeDisplay[] = [];
    let rest = position.qtyTFuture;

    for (const trade of sortedTrades) {
      const tradeQty = trade.side === Side.Buy
        ? -trade.qty
        : trade.qty;
      rest += tradeQty;

      filteredTrades.push({
        price: trade.price,
        qtyBatch: trade.qtyBatch,
        side: trade.side
      });

      if (Math.round(rest) === 0) {
        break;
      }
    }

    return filteredTrades;
  }
}
