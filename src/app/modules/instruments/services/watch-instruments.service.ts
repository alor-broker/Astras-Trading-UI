import { Injectable, NgZone, OnDestroy, inject } from '@angular/core';
import {
  asyncScheduler,
  combineLatest,
  Observable,
  pairwise,
  scheduled,
  Subscription,
  switchMap,
  take,
} from 'rxjs';
import {
  debounceTime,
  filter,
  map,
  startWith
} from 'rxjs/operators';
import { HistoryService } from 'src/app/shared/services/history.service';
import { QuotesService } from 'src/app/shared/services/quotes.service';
import { WatchedInstrument } from '../models/watched-instrument.model';
import { WatchlistCollectionService } from './watchlist-collection.service';
import { InstrumentsService } from './instruments.service';
import { Instrument } from '../../../shared/models/instruments/instrument.model';
import { WatchlistItem } from "../models/watchlist.model";
import { WatchlistUpdatesManager } from "../utils/watchlist-updates-manager";
import { InstrumentsToWatchManager } from "../utils/instruments-to-watch-manager";
import { GuidGenerator } from "../../../shared/utils/guid";
import { TimeframeValue } from "../../light-chart/models/light-chart.models";
import { MathHelper } from "../../../shared/utils/math-helper";
import { CandlesService } from "./candles.service";
import { InstrumentKey } from "../../../shared/models/instruments/instrument-key.model";
import { Candle } from "../../../shared/models/history/candle.model";

class WatchlistSubscriptionState {
  constructor(
    public readonly watchlistUpdatesState: WatchlistUpdatesManager,
    public readonly instrumentsToWatchState: InstrumentsToWatchManager,
    public readonly collectionChangeSubscription: Subscription,
  ) {
  }

  destroy(): void {
    this.collectionChangeSubscription.unsubscribe();
    this.watchlistUpdatesState.destroy();
    this.instrumentsToWatchState.destroy();
  }
}

@Injectable()
export class WatchInstrumentsService implements OnDestroy {
  private readonly historyService = inject(HistoryService);
  private readonly quotesService = inject(QuotesService);
  private readonly instrumentsService = inject(InstrumentsService);
  private readonly watchlistCollectionService = inject(WatchlistCollectionService);
  private readonly candlesService = inject(CandlesService);
  private readonly ngZone = inject(NgZone);

  private readonly watchlistSubscriptionMap = new Map<string, WatchlistSubscriptionState>();

  unsubscribeFromList(listId: string): void {
    const watchlistState = this.watchlistSubscriptionMap.get(listId);
    if (watchlistState == null) {
      return;
    }

    watchlistState.destroy();
    this.watchlistSubscriptionMap.delete(listId);
  }

  subscribeToListUpdates(listId: string, timeframe: TimeframeValue): Observable<WatchedInstrument[]> {
    return this.ngZone.runOutsideAngular(() => {
      // reuse existing subscription in case of watchlist collections changes
      // for example, user selects one more list and existing lists can be reused
      // timeframe will not be changed in this case
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
          watchlistUpdatesState,
          instrumentsToWatchState,
          collectionChangeSubscription
        )
      );

      return watchlistUpdatesState.updates$;
    });
  }

  ngOnDestroy(): void {
    this.clearSubscriptions();
  }

  clearSubscriptions(): void {
    this.watchlistSubscriptionMap.forEach((value, key) => this.unsubscribeFromList(key));
  }

  private getHistoryFromTime(timeframe: TimeframeValue): number {
    const nowDate = this.getHistoryToTime(timeframe);
    switch (timeframe) {
      case TimeframeValue.Day:
        return nowDate - 3600 * 24 * 3;
      case TimeframeValue.W:
        return nowDate - 3600 * 24 * 21;
      case TimeframeValue.Month:
        return nowDate - 3600 * 24 * 31 * 3;
      default:
        return nowDate - 3600 * 24;
    }
  }

  private getHistoryToTime(timeframe: TimeframeValue): number {
    switch (timeframe) {
      case TimeframeValue.Day:
        return Math.round(new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), 0, 0, -1).getTime() / 1000);
      case TimeframeValue.W:
        return Math.round(new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() - ((new Date().getDay() + 6) % 7), 0, 0, -1).getTime() / 1000);
      case TimeframeValue.Month:
        return Math.round(new Date(new Date().getFullYear(), new Date().getMonth(), 1, 0, 0, -1).getTime() / 1000);
      case TimeframeValue.H4:
        return Math.round(new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), new Date().getHours() - 3, 0, -1).getTime() / 1000);
      case TimeframeValue.H:
        return Math.round(new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), new Date().getHours(), 0, -1).getTime() / 1000);
      case TimeframeValue.M15:
        return Math.round(new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), new Date().getHours(), new Date().getMinutes() - 14, -1).getTime() / 1000);
      case TimeframeValue.M5:
        return Math.round(new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), new Date().getHours(), new Date().getMinutes() - 4, -1).getTime() / 1000);
      case TimeframeValue.M1:
        return Math.round(new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), new Date().getHours(), new Date().getMinutes(), -1).getTime() / 1000);
      case TimeframeValue.S10:
        return Math.round(new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), new Date().getHours(), new Date().getMinutes(), new Date().getSeconds() - 9, -1).getTime() / 1000);
      case TimeframeValue.S5:
        return Math.round(new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), new Date().getHours(), new Date().getMinutes(), new Date().getSeconds() - 4, -1).getTime() / 1000);
      case TimeframeValue.S1:
        return Math.round(new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), new Date().getHours(), new Date().getMinutes(), new Date().getSeconds(), -1).getTime() / 1000);
    }
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
        return this.historyService.getLastTwoCandles(i)
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
      this.quotesService.getQuotes(wi.instrument.symbol, wi.instrument.exchange, wi.instrument.instrumentGroup),
      this.getLastTwoCandlesUpdates(wi.instrument, timeframe)
    ])
      .pipe(
        map(([quote, candlePair]) => {
          if (candlePair[1] != null && candlePair[1].time < this.getHistoryToTime(timeframe)) {
            return {quote, lastCandle: candlePair[1]};
          }
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
    return this.historyService.getHistory({
      symbol: instrumentKey.symbol,
      exchange: instrumentKey.exchange,
      tf: timeframe,
      from: this.getHistoryFromTime(timeframe),
      to: this.getHistoryToTime(timeframe),
      countBack: 1
    })
      .pipe(
        take(1),
        map(history => {
          if (history == null || history.history.length === 0) {
            return null;
          }

          return history.history[history.history.length - 1];
        }),
        switchMap(historyCandle => {
            return this.candlesService.getInstrumentLastCandle(instrumentKey, timeframe)
              .pipe(
                startWith(historyCandle, historyCandle),
                pairwise(), // Needs to get last value of previous candle
                filter((c, i) => c[0]?.time !== c[1]?.time || i === 0)
              );
          }
        )
      );
  }
}
