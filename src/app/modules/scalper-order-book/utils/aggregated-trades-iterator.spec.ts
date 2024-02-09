import { Side } from "src/app/shared/models/enums/side.model";
import { AllTradesItem } from "../../../shared/models/all-trades.model";
import { AggregatedTradesIterator } from "./aggregated-trades-iterator";

describe('AggregatedTradesIterator', () => {
  const createTrade = (price: number, side: Side, qty: number, timestamp: number): AllTradesItem => {
    return {
      price: Math.round(price),
      side,
      qty: Math.round(qty),
      timestamp: Math.round(timestamp),
    } as AllTradesItem;
  };

  const generateTradesSequence = (
    length: number,
    timestampFrom: number,
    timestampStep: number,
    sideSelector?: (index: number) => Side
  ): AllTradesItem[] => {
    const latestItem = createTrade(
      Math.random() * 100,
      sideSelector?.(length - 1) ?? (Math.random() > 0.5 ? Side.Sell : Side.Buy),
      Math.random() * 1000,
      timestampFrom
    );

    const items: AllTradesItem[] = [
      latestItem
    ];

    for (let i = 1; i < length; i++) {
      const prev = items[i - 1];
      items.push(
        createTrade(
          Math.random() * 100,
          sideSelector?.(length - i) ?? (Math.random() > 0.5 ? Side.Sell : Side.Buy),
          Math.random() * 1000,
          prev.timestamp - timestampStep
        )
      );
    }

    return items.reverse();
  };

  it('should not apply aggregation when tradesAggregationPeriodMs = 0', () => {
    const now = Date.now();
    const timeframe = 0;

    const trades: AllTradesItem[] = generateTradesSequence(2, now, 2);
    const [oldestItem, newestItem] = trades;

    const iterator = new AggregatedTradesIterator(trades, timeframe);

    const firstValue = iterator.next().value;
    expect(firstValue)
      .toEqual({
        side: newestItem.side as Side,
        volume: newestItem.qty,
        minPrice: newestItem.price,
        maxPrice: newestItem.price
      });

    const secondValue = iterator.next().value;
    expect(secondValue)
      .toEqual({
        side: oldestItem.side as Side,
        volume: oldestItem.qty,
        minPrice: oldestItem.price,
        maxPrice: oldestItem.price
      });
  });

  it('should correctly apply aggregation when all items have the same side', () => {
    const now = 1707287405110;
    const timeframe = 5;
    const tradesLength = 12;

    const trades: AllTradesItem[] = generateTradesSequence(tradesLength, now, 1, () => Side.Buy);

    const iterator = new AggregatedTradesIterator(trades, timeframe);

    const cases: {
      title: string;
      expectedItems: AllTradesItem[] | null;
      done?: boolean;
    }[] = [
      {
        title: '1 value',
        expectedItems: trades.slice(-1)
      },
      {
        title: '2 value',
        expectedItems: trades.slice(-6, -1)
      },
      {
        title: '3 value',
        expectedItems: trades.slice(1, 6)
      },
      {
        title: '4 value',
        expectedItems: trades.slice(0, 1)
      },
      {
        title: '5 value',
        expectedItems: null,
        done: true
      }
    ];

    cases.forEach(testCase => {
      const value = iterator.next();
      const expectedItems = testCase.expectedItems;
      const expectedValue = expectedItems != null
        ? {
          side: expectedItems[0].side as Side,
          volume: expectedItems.reduce((total, curr) => total + curr.qty, 0),
          minPrice: Math.min(...expectedItems.map(x => x.price)),
          maxPrice: Math.max(...expectedItems.map(x => x.price)),
        }
        : null;

      expect(value.value)
        .withContext(testCase.title)
        .toEqual(expectedValue);

      if (testCase.done != null) {
        expect(value.done)
          .withContext(testCase.title)
          .toEqual(testCase.done);
      }
    });
  });

  it('should correctly apply aggregation when items have different side', () => {
    const now = 1707294113;
    const timeframe = 5000;
    const tradesLength = 19;

    const trades: AllTradesItem[] = generateTradesSequence(
      tradesLength,
      now,
      1000,
      index => (index > tradesLength - 3) ? Side.Buy : Side.Sell
    );

    const iterator = new AggregatedTradesIterator(trades, timeframe);

    const cases: {
      title: string;
      expectedItems: AllTradesItem[] | null;
    }[] = [
      {
        title: '1 value',
        // last three items have Buy side.
        expectedItems: trades.slice(-3)
      },
      {
        title: '2 value',
        expectedItems: trades.slice(-5, -3)
      },
      {
        title: '3 value',
        expectedItems: trades.slice(-10, -5),
      }
    ];

    cases.forEach(testCase => {
      const value = iterator.next().value;
      const expectedItems = testCase.expectedItems;
      const expectedValue = expectedItems != null
        ? {
          side: expectedItems[0].side as Side,
          volume: expectedItems.reduce((total, curr) => total + curr.qty, 0),
          minPrice: Math.min(...expectedItems.map(x => x.price)),
          maxPrice: Math.max(...expectedItems.map(x => x.price)),
        }
        : null;

      expect(value)
        .withContext(testCase.title)
        .toEqual(expectedValue);
    });
  });

  it('should correctly apply aggregation when some timeframes are empty', () => {
    const now = 1707294113;
    const timeframe = 5000;
    const tradesLength = 3;

    const trades: AllTradesItem[] = generateTradesSequence(
      tradesLength,
      now,
      12000
    );

    const iterator = new AggregatedTradesIterator(trades, timeframe);

    const cases: {
      title: string;
      expectedItems: AllTradesItem[] | null;
      done?: boolean;
    }[] = [
      {
        title: '1 value',
        expectedItems: trades.slice(-1)
      },
      {
        title: '2 value',
        expectedItems: null
      },
      {
        title: '3 value',
        expectedItems: trades.slice(-2, -1)
      },
      {
        title: '4 value',
        expectedItems: null
      },
      {
        title: '5 value',
        expectedItems: trades.slice(0, 1),
      },
      {
        title: '6 value',
        expectedItems: null,
        done: true
      },
    ];

    cases.forEach(testCase => {
      const value = iterator.next();
      const expectedItems = testCase.expectedItems;
      const expectedValue = expectedItems != null
        ? {
          side: expectedItems[0].side as Side,
          volume: expectedItems.reduce((total, curr) => total + curr.qty, 0),
          minPrice: Math.min(...expectedItems.map(x => x.price)),
          maxPrice: Math.max(...expectedItems.map(x => x.price)),
        }
        : null;

      expect(value.value)
        .withContext(testCase.title)
        .toEqual(expectedValue);

      if (testCase.done != null) {
        expect(value.done)
          .withContext(testCase.title)
          .toEqual(testCase.done);
      }
    });
  });
});
