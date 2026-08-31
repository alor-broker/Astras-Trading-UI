import {TestBed} from '@angular/core/testing';
import {getUnixTime} from 'date-fns';
import {
  EMPTY,
  firstValueFrom,
  Observable,
  of
} from 'rxjs';
import {TimeframeValue} from '@terminal-core-lib/common/types/timeframe.types';
import {CandlesService} from '@terminal-core-lib/features/instruments/services/candles.service';
import {Candle} from '@terminal-core-lib/features/instruments/services/candles-service.types';
import {InstrumentsService} from '@terminal-core-lib/features/instruments/services/instruments.service';
import {QuotesService} from '@terminal-core-lib/features/instruments/services/quotes.service';
import {WatchlistCollectionService} from '@terminal-core-lib/features/watchlist/services/watchlist-collection.service';
import {InstrumentKey} from '@terminal-core-lib/common/types/instrument.types';
import {InstrumentFixtures} from '@testing-lib/fixtures/instrument';
import {WatchlistHistoryTimeRangeHelper} from '../utils/watchlist-history-time-range.helper';
import {WatchlistService} from './watchlist.service';

interface WatchlistServiceInternals {
  getLastTwoCandlesUpdates(
    instrumentKey: InstrumentKey,
    timeframe: TimeframeValue
  ): Observable<(Candle | null)[]>;
}

describe('WatchlistService', () => {
  const now = new Date('2026-06-18T20:30:00.000Z');
  const nowUnixSeconds = getUnixTime(now);

  let service: WatchlistService;
  let getHistory: ReturnType<typeof vi.fn>;
  let getCandleSubscription: ReturnType<typeof vi.fn>;

  function createCandle(time: number, close: number): Candle {
    return {
      time,
      close,
      open: close,
      high: close,
      low: close,
      volume: 0
    };
  }

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);

    getHistory = vi.fn();
    getCandleSubscription = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        WatchlistService,
        {
          provide: WatchlistCollectionService,
          useValue: {
            getWatchlistCollection: vi.fn().mockReturnValue(EMPTY)
          }
        },
        {
          provide: InstrumentsService,
          useValue: {
            getInstrument: vi.fn()
          }
        },
        {
          provide: CandlesService,
          useValue: {
            getHistory,
            getCandleSubscription,
            getLastTwoDailyCandles: vi.fn()
          }
        },
        {
          provide: QuotesService,
          useValue: {
            getQuotesSubscription: vi.fn()
          }
        }
      ]
    });

    service = TestBed.inject(WatchlistService);
  });

  afterEach(() => {
    service.clearSubscriptions();
    vi.useRealTimers();
  });

  it('should reuse subscription for the same list', () => {
    const dayUpdates$ = service.subscribeToListUpdates('list-1', TimeframeValue.Day);
    const sameListUpdates$ = service.subscribeToListUpdates('list-1', TimeframeValue.Day);

    expect(sameListUpdates$).toBe(dayUpdates$);
  });

  it('should request two latest candles up to current time', async () => {
    const previousCandle = createCandle(1, 100);
    const lastCandle = createCandle(2, 110);
    getHistory.mockReturnValue(of({
      history: [previousCandle, lastCandle],
      prev: 0,
      next: 0
    }));
    getCandleSubscription.mockReturnValue(EMPTY);

    const result = await firstValueFrom(
      (service as unknown as WatchlistServiceInternals).getLastTwoCandlesUpdates(
        InstrumentFixtures.createInstrumentKey(),
        TimeframeValue.Day
      )
    );

    expect(result).toEqual([previousCandle, lastCandle]);
    expect(getHistory).toHaveBeenCalledWith({
      symbol: 'SBER',
      exchange: 'MOEX',
      tf: TimeframeValue.Day,
      from: WatchlistHistoryTimeRangeHelper.getFromTime(TimeframeValue.Day, now),
      to: nowUnixSeconds,
      countBack: 2
    });
  });
});
