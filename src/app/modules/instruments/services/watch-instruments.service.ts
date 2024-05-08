import { DestroyRef, Injectable } from '@angular/core';
import { combineLatest, Observable, pairwise, Subscription, switchMap, take } from 'rxjs';
import { filter, map, startWith } from 'rxjs/operators';
import { HistoryService } from 'src/app/shared/services/history.service';
import { QuotesService } from 'src/app/shared/services/quotes.service';
import { WatchedInstrument } from '../models/watched-instrument.model';
import { WatchlistCollectionService } from './watchlist-collection.service';
import { InstrumentsService } from './instruments.service';
import { Instrument } from '../../../shared/models/instruments/instrument.model';
import { WatchlistItem } from "../models/watchlist.model";
import { WatchlistUpdatesState } from "../utils/watchlist-updates-state";
import { InstrumentsToWatchState } from "../utils/instruments-to-watch-state";
import { GuidGenerator } from "../../../shared/utils/guid";
import { TimeframeValue } from "../../light-chart/models/light-chart.models";
import { MathHelper } from "../../../shared/utils/math-helper";
import { CandlesService } from "./candles.service";

@Injectable()
export class WatchInstrumentsService {
  private readonly watchlistUpdatesState = new WatchlistUpdatesState();
  private readonly instrumentsToWatchState = new InstrumentsToWatchState();

  private collectionChangeSubscription?: Subscription;

  constructor(
    private readonly history: HistoryService,
    private readonly quotesService: QuotesService,
    private readonly instrumentsService: InstrumentsService,
    private readonly watchlistCollectionService: WatchlistCollectionService,
    private readonly candlesService: CandlesService,
    destroyRef: DestroyRef) {
    destroyRef.onDestroy(() => this.clear());
    destroyRef.onDestroy(() => this.watchlistUpdatesState.destroy());
  }

  clear(): void {
    this.watchlistUpdatesState.removeAll();
    this.instrumentsToWatchState.removeAll();

    this.collectionChangeSubscription?.unsubscribe();
  }

  getWatched(listId: string, timeframe: TimeframeValue): Observable<WatchedInstrument[]> {
    this.clear();

    this.collectionChangeSubscription = this.watchlistCollectionService.getWatchlistCollection().pipe(
      map(currentCollection => currentCollection.collection.find(x => x.id === listId)),
      filter(x => !!x)
    ).subscribe(currentList => {
      this.refreshWatchItems(
        currentList!.items.map(item => ({
            ...item,
            recordId: item.recordId ?? GuidGenerator.newGuid(),
          })
        ),
        timeframe
      );
    });

    return this.watchlistUpdatesState.updates$.pipe(
      map(u => [...u])
    );
  }

  private refreshWatchItems(items: WatchlistItem[], timeframe: TimeframeValue): void {
    const previousIds = new Set(this.instrumentsToWatchState.getCurrentItemIds());
    const currentIds = new Set<string>();

    items.forEach(item => {
      const currentRecordId = item.recordId!;
      currentIds.add(currentRecordId);
      if (!previousIds.has(currentRecordId)) {
        this.instrumentsToWatchState.addItem(
          item,
          () => this.watchlistUpdatesState.removeItem(currentRecordId)
        );

        this.initInstrumentWatch(item, timeframe);
      } else {
        this.watchlistUpdatesState.updateItem(
          currentRecordId,
          {
            favoriteOrder: item.favoriteOrder
          }
        );
      }
    });

    previousIds.forEach(id => {
      if (!currentIds.has(id)) {
        this.instrumentsToWatchState.removeItem(id);
      }
    });

  }

  private initInstrumentWatch(instrument: WatchlistItem, timeframe: TimeframeValue): void {
    this.instrumentsService.getInstrument(instrument).pipe(
      take(1),
      filter((x): x is Instrument => !!x),
      switchMap(i => {
        return this.history.getLastTwoCandles(i)
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
            take(1)
          );
      })
    ).subscribe(wi => {
      this.watchlistUpdatesState.addItem(wi);
      this.setupInstrumentUpdatesSubscription(wi, timeframe);
    });
  }

  private setupInstrumentUpdatesSubscription(wi: WatchedInstrument, timeframe: TimeframeValue): void {
    const lastCandleStream = this.history.getHistory({
      symbol: wi.instrument.symbol,
      exchange: wi.instrument.exchange,
      tf: timeframe,
      from: this.getHistoryFromTime(timeframe),
      to: this.getHistoryToTime(timeframe),
      countBack: 1
    })
      .pipe(
        map(h => {
          if (h == null || h.history.length === 0) {
            return null;
          }

          return h.history[h.history.length - 1];
        }),
        switchMap(candle => this.candlesService.getInstrumentLastCandle(wi.instrument, timeframe)
          .pipe(
            startWith(
              candle,
              candle // Needs for pairwise emits first value
            ),
            pairwise(), // Needs to get last value of previous candle
            filter((c, i) => c[0]?.time !== c[1]?.time || i === 0)
          ),
        )
      );

    const sub = combineLatest([
      this.quotesService.getQuotes(wi.instrument.symbol, wi.instrument.exchange, wi.instrument.instrumentGroup),
      lastCandleStream
    ])
      .pipe(
        map(([quote, candlePair]) => {
            if (candlePair[1] != null && candlePair[1].time < this.getHistoryToTime(timeframe)) {
              return { quote, lastCandle: candlePair[1] };
            }
            return { quote, lastCandle: candlePair[0] };
        }),
      )
      .subscribe(({ quote, lastCandle }) => {
        const update = <WatchedInstrument>{
          prevTickPrice: quote.last_price - (quote.change ?? 0),
          closePrice: quote.prev_close_price,
          openPrice: quote.open_price,
          price: quote.last_price,
          priceChange: (quote.last_price != null && lastCandle != null) ? MathHelper.round(quote.last_price - lastCandle.close, 4) : 0,
          priceChangeRatio: (quote.last_price != null && lastCandle != null) ? MathHelper.round(((quote.last_price/lastCandle.close) - 1) * 100, 2) : 0,
          minPrice: quote.low_price,
          maxPrice: quote.high_price,
          volume: quote.volume
        };

        this.watchlistUpdatesState.updateItem(wi.recordId, update);
      });

    this.instrumentsToWatchState.setUpdatesSubscription(wi.recordId, sub);
  }

  getHistoryFromTime(timeframe: TimeframeValue): number {
    const nowDate = this.getHistoryToTime(timeframe);
    switch(timeframe) {
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

  getHistoryToTime(timeframe: TimeframeValue): number {
    switch(timeframe) {
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
        return Math.round(new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), new Date().getHours(), new Date().getMinutes(),-1).getTime() / 1000);
      case TimeframeValue.S10:
        return Math.round(new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), new Date().getHours(), new Date().getMinutes(), new Date().getSeconds() - 9, -1).getTime() / 1000);
      case TimeframeValue.S5:
        return Math.round(new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), new Date().getHours(), new Date().getMinutes(), new Date().getSeconds() - 4, -1).getTime() / 1000);
      case TimeframeValue.S1:
        return Math.round(new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), new Date().getHours(), new Date().getMinutes(), new Date().getSeconds(), -1).getTime() / 1000);
    }
  }
}
