import {
  inject,
  Injectable,
  OnDestroy
} from '@angular/core';
import {InstrumentsService} from "@terminal-core-lib/features/instruments/services/instruments.service";
import {WatchlistCollectionService} from "@terminal-core-lib/features/watchlist/services/watchlist-collection.service";
import {CandlesService} from '@terminal-core-lib/features/instruments/services/candles.service';
import {TimeframeValue} from '@terminal-core-lib/common/types/timeframe.types';
import {
  asyncScheduler,
  combineLatest,
  debounceTime,
  filter,
  map,
  Observable,
  pairwise,
  scheduled,
  startWith,
  Subscription,
  switchMap,
  take
} from "rxjs";
import {WatchedInstrument} from "./watchlist-service.types";
import {GuidGenerator} from '@terminal-core-lib/common/utils/guid-generator';
import {InstrumentsToWatchManager} from '../utils/instruments-to-watch-manager';
import {WatchlistUpdatesManager} from '../utils/watchlist-updates-manager';
import {WatchlistItem} from '@terminal-core-lib/features/watchlist/types/watchlist.types';
import {
  Instrument,
  InstrumentKey
} from '@terminal-core-lib/common/types/instrument.types';
import {QuotesService} from '@terminal-core-lib/features/instruments/services/quotes.service';
import {MathHelper} from '@terminal-core-lib/common/utils/math.helper';
import {Candle} from '@terminal-core-lib/features/instruments/services/candles-service.types';
import {WatchlistHistoryTimeRangeHelper} from '../utils/watchlist-history-time-range.helper';

class WatchlistSubscriptionState {
  constructor(
    public readonly listId: string,
    public readonly watchlistUpdatesState: WatchlistUpdatesManager,
    public readonly instrumentsToWatchState: InstrumentsToWatchManager,
    public readonly collectionChangeSubscription: Subscription
  ) {
  }

  destroy(): void {
    this.collectionChangeSubscription.unsubscribe();
    this.watchlistUpdatesState.destroy();
    this.instrumentsToWatchState.destroy();
  }
}

@Injectable()
export class WatchlistService implements OnDestroy {
  private readonly instrumentsService = inject(InstrumentsService);

  private readonly watchlistCollectionService = inject(WatchlistCollectionService);

  private readonly candlesService = inject(CandlesService);

  private readonly quotesService = inject(QuotesService);

  private readonly watchlistSubscriptionMap = new Map<string, WatchlistSubscriptionState>();

  unsubscribeFromList(listId: string): void {
    this.destroySubscriptions(state => state.listId === listId);
  }

  subscribeToListUpdates(listId: string, timeframe: TimeframeValue): Observable<WatchedInstrument[]> {
    // reuse existing subscription in case of watchlist collections changes
    // for example, user selects one more list and existing lists can be reused
    const existingSubscription = this.watchlistSubscriptionMap.get(listId);
    if (existingSubscription != null) {
      return existingSubscription.watchlistUpdatesState.updates$;
    }

    const watchlistUpdatesState = new WatchlistUpdatesManager();
    const instrumentsToWatchState = new InstrumentsToWatchManager();

    const collectionChangeSubscription = scheduled(this.watchlistCollectionService.getWatchlistCollection(), asyncScheduler)
      .pipe(
        map(currentCollection => currentCollection.collection.find(x => x.id === listId)),
        filter(x => !!x),
      ).subscribe(currentList => {
        this.refreshWatchItems(
          watchlistUpdatesState,
          instrumentsToWatchState,
          currentList!.items.map(item => ({
              ...item,
              recordId: item.recordId ?? GuidGenerator.newGuid(),
            })
          ),
          timeframe
        );
      });

    this.watchlistSubscriptionMap.set(
      listId,
      new WatchlistSubscriptionState(
        listId,
        watchlistUpdatesState,
        instrumentsToWatchState,
        collectionChangeSubscription
      )
    );

    return watchlistUpdatesState.updates$;
  }

  ngOnDestroy(): void {
    this.clearSubscriptions();
  }

  clearSubscriptions(): void {
    this.destroySubscriptions(() => true);
  }

  private refreshWatchItems(
    watchlistUpdatesState: WatchlistUpdatesManager,
    instrumentsToWatchState: InstrumentsToWatchManager,
    items: WatchlistItem[],
    timeframe: TimeframeValue
  ): void {
    instrumentsToWatchState.getCurrentItemIds().pipe(
      take(1)
    ).subscribe(currentItemIds => {
      const previousIds = new Set(currentItemIds);
      const currentIds = new Set<string>();

      const instrumentsToAdd: WatchlistItem[] = [];

      items.forEach(item => {
        const currentRecordId = item.recordId!;
        currentIds.add(currentRecordId);

        if (!previousIds.has(currentRecordId)) {
          instrumentsToWatchState.addItem(
            item,
            () => watchlistUpdatesState.removeItem(currentRecordId)
          );

          instrumentsToAdd.push(item);
        } else {
          watchlistUpdatesState.updateItem(
            currentRecordId,
            {
              favoriteOrder: item.favoriteOrder
            }
          );
        }
      });

      previousIds.forEach(id => {
        if (!currentIds.has(id)) {
          instrumentsToWatchState.removeItem(id);
        }
      });

      this.initInstrumentWatchBatch(
        watchlistUpdatesState,
        instrumentsToWatchState,
        instrumentsToAdd,
        timeframe
      );
    });
  }

  private initInstrumentWatchBatch(
    watchlistUpdatesState: WatchlistUpdatesManager,
    instrumentsToWatchState: InstrumentsToWatchManager,
    items: WatchlistItem[],
    timeframe: TimeframeValue): void {
    do {
      const batch = items.splice(0, 5);
      if (batch.length === 0) {
        return;
      }

      setTimeout(() => {
        batch.forEach((item) => this.initInstrumentWatch(
          watchlistUpdatesState,
          instrumentsToWatchState,
          item,
          timeframe
        ));
      });
      // eslint-disable-next-line no-constant-condition
    } while (true);
  }

  private initInstrumentWatch(
    watchlistUpdatesState: WatchlistUpdatesManager,
    instrumentsToWatchState: InstrumentsToWatchManager,
    instrument: WatchlistItem,
    timeframe: TimeframeValue
  ): void {
    this.instrumentsService.getInstrument(instrument).pipe(
      take(1),
      filter((x): x is Instrument => !!x),
      switchMap(i => {
        return this.candlesService.getLastTwoDailyCandles(i)
          .pipe(
            map(candles => <WatchedInstrument>{
              recordId: instrument.recordId,
              addTime: instrument.addTime ?? Date.now(),
              favoriteOrder: instrument.favoriteOrder,
              instrument: i,
              closePrice: candles?.prev.close ?? 0,
              openPrice: candles?.cur.open ?? 0,
              prevTickPrice: 0,
              priceChange: 0,
              price: 0,
              minPrice: candles?.cur.low,
              maxPrice: candles?.cur.high,
              volume: candles?.cur.volume,
              priceChangeRatio: 0,
            }),
            take(1),
          );
      })
    ).subscribe(wi => {
      watchlistUpdatesState.addItem(wi);
      this.setupInstrumentUpdatesSubscription(
        watchlistUpdatesState,
        instrumentsToWatchState,
        wi,
        timeframe
      );
    });
  }

  private setupInstrumentUpdatesSubscription(
    watchlistUpdatesState: WatchlistUpdatesManager,
    instrumentsToWatchState: InstrumentsToWatchManager,
    wi: WatchedInstrument,
    timeframe: TimeframeValue
  ): void {
    const sub = combineLatest([
      this.quotesService.getQuotesSubscription(wi.instrument.symbol, wi.instrument.exchange, wi.instrument.instrumentGroup),
      this.getLastTwoCandlesUpdates(wi.instrument, timeframe)
    ])
      .pipe(
        map(([quote, candlePair]) => {
          return {quote, lastCandle: candlePair[0]};
        }),
        debounceTime(250)
      )
      .subscribe(({quote, lastCandle}) => {
        const update = <WatchedInstrument>{
          prevTickPrice: quote.last_price - (quote.change ?? 0),
          closePrice: quote.prev_close_price,
          openPrice: quote.open_price,
          price: quote.last_price,
          priceChange: (quote.last_price != null && lastCandle != null) ? MathHelper.round(quote.last_price - lastCandle.close, 4) : 0,
          priceChangeRatio: (quote.last_price != null && lastCandle != null) ? MathHelper.round(((quote.last_price / lastCandle.close) - 1) * 100, 2) : 0,
          minPrice: quote.low_price,
          maxPrice: quote.high_price,
          volume: quote.volume
        };

        watchlistUpdatesState.updateItem(wi.recordId, update);
      });

    instrumentsToWatchState.setUpdatesSubscription(wi.recordId, sub);
  }

  private getLastTwoCandlesUpdates(instrumentKey: InstrumentKey, timeframe: TimeframeValue): Observable<(Candle | null)[]> {
    return this.candlesService.getHistory({
      symbol: instrumentKey.symbol,
      exchange: instrumentKey.exchange,
      tf: timeframe,
      from: WatchlistHistoryTimeRangeHelper.getFromTime(timeframe),
      to: WatchlistHistoryTimeRangeHelper.getToTime(),
      countBack: 2
    })
      .pipe(
        take(1),
        map(history => {
          if (history == null || history.history.length === 0) {
            return [null, null];
          }

          const candles = history.history.slice(-2);
          if (candles.length === 1) {
            return [null, candles[0]];
          }

          return candles;
        }),
        switchMap(historyCandles => {
            return this.candlesService.getCandleSubscription(instrumentKey, timeframe)
              .pipe(
                startWith(...historyCandles),
                pairwise(), // Needs to get last value of previous candle
                filter((c, i) => c[0]?.time !== c[1]?.time || i === 0)
              );
          }
        )
      );
  }

  private destroySubscriptions(predicate: (state: WatchlistSubscriptionState) => boolean): void {
    for (const [key, state] of Array.from(this.watchlistSubscriptionMap.entries())) {
      if (!predicate(state)) {
        continue;
      }

      state.destroy();
      this.watchlistSubscriptionMap.delete(key);
    }
  }
}
