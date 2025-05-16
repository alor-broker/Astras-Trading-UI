import { AllTradesItem } from "../../../shared/models/all-trades.model";
import { Side } from "../../../shared/models/enums/side.model";

export interface AggregatedTrade {
  minPrice: number;
  maxPrice: number;
  side: Side;
  volume: number;
}

class AggregationRange {
  private currentStart: number;

  constructor(initialValue: number, private readonly period: number) {
    this.currentStart = initialValue;
  }

  get bounds(): { start: number, end: number } {
    return {
      start: this.currentStart,
      end: Math.floor(this.currentStart + this.period - 1)
    };
  }

  moveBack(): boolean {
    const newStart = Math.floor(this.currentStart - this.period);
    if (newStart <= 0) {
      return false;
    }

    this.currentStart = newStart;
    return true;
  }
}

export class AggregatedTradesIterator implements Iterator<AggregatedTrade | null> {
  private currentIndex?: number;
  private currentAggregationRange?: AggregationRange;
  private readonly iterator: (() => IteratorResult<AggregatedTrade | null, null>);

  constructor(
    private readonly orderedTrades: AllTradesItem[],
    private readonly tradesAggregationPeriodMs: number) {
    if (tradesAggregationPeriodMs === 0) {
      this.iterator = this.noAggregationIterator;
    } else {
      this.iterator = this.aggregationIterator;
    }
  }

  next(): IteratorResult<AggregatedTrade | null, null> {
    return this.iterator();
  }

  private aggregationIterator(): IteratorResult<AggregatedTrade | null, null> {
    if (this.orderedTrades.length === 0) {
      return {
        done: true,
        value: null
      };
    }

    if (this.currentIndex == null || this.currentAggregationRange == null) {
      this.currentIndex = this.orderedTrades.length - 1;
      const latestTrade = this.orderedTrades[this.currentIndex];

      this.currentAggregationRange = new AggregationRange(
        Math.floor(Math.floor(latestTrade.timestamp / this.tradesAggregationPeriodMs) * this.tradesAggregationPeriodMs),
        this.tradesAggregationPeriodMs
      );
    }

    if (this.currentIndex < 0 || this.currentAggregationRange.bounds.start < 0) {
      return {
        done: true,
        value: null
      };
    }

    const aggregatedTrades: AllTradesItem[] = [];
    let lastSide: Side | null = null;

    do {
      const bounds = this.currentAggregationRange.bounds;
      const currentTrade = this.orderedTrades[this.currentIndex];
      const tradeSide = currentTrade.side as Side;
      lastSide = lastSide ?? tradeSide;

      if (currentTrade.timestamp >= bounds.start && currentTrade.timestamp <= bounds.end) {
        if (tradeSide === lastSide) {
          aggregatedTrades.push(currentTrade);
          this.currentIndex--;
        } else {
          // side changed
          break;
        }
      } else {
        if (!this.currentAggregationRange.moveBack()) {
          break;
        }

        break;
      }
    } while (this.currentIndex >= 0);

    if (lastSide == null) {
      return {
        done: true,
        value: null
      };
    }

    if (aggregatedTrades.length === 0) {
      return {
        done: false,
        value: null
      };
    }

    let minPrice = Number.MAX_VALUE;
    let maxPrice = Number.MIN_VALUE;
    let totalVolume = 0;
    aggregatedTrades.forEach(trade => {
      minPrice = Math.min(minPrice, trade.price);
      maxPrice = Math.max(maxPrice, trade.price);
      totalVolume = Math.floor(totalVolume + trade.qty);
    });

    return {
      done: false,
      value: {
        minPrice,
        maxPrice,
        side: lastSide,
        volume: totalVolume
      }
    };
  }

  private noAggregationIterator(): IteratorResult<AggregatedTrade, null> {
    this.currentIndex ??= this.orderedTrades.length;

    this.currentIndex--;

    if (this.currentIndex < 0) {
      return {
        done: true,
        value: null
      };
    }

    const currentTrade = this.orderedTrades[this.currentIndex];

    return {
      done: false,
      value: {
        minPrice: currentTrade.price,
        maxPrice: currentTrade.price,
        side: currentTrade.side as Side,
        volume: currentTrade.qty
      }
    };
  }
}
