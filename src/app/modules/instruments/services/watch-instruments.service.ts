import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  Subscription,
  switchMap,
  take, tap
} from 'rxjs';
import {
  filter,
  map
} from 'rxjs/operators';
import { HistoryService } from 'src/app/shared/services/history.service';
import { QuotesService } from 'src/app/shared/services/quotes.service';
import { WatchedInstrument } from '../models/watched-instrument.model';
import { WatchlistCollectionService } from './watchlist-collection.service';
import { InstrumentsService } from './instruments.service';
import { Instrument } from '../../../shared/models/instruments/instrument.model';
import { InstrumentSelectSettings } from '../models/instrument-select-settings.model';
import {WatchlistItem} from "../models/watchlist.model";

@Injectable()
export class WatchInstrumentsService {
  private watchListState: WatchedInstrument[] = [];
  private readonly watchListStateSubj = new BehaviorSubject<WatchedInstrument[]>(this.watchListState);
  private watchListUpdates$ = this.watchListStateSubj.asObservable()
    .pipe(
      map(x => x.sort((a, b) => a.instrument.symbol.localeCompare(b.instrument.symbol)))
    );

  private readonly instrumentsToWatch$ = new BehaviorSubject<WatchlistItem[]>([]);
  private readonly quotesSubsByKey = new Map<string, Subscription>();
  private instrumentsToWatchSubscription?: Subscription;
  private collectionChangeSubscription?: Subscription;


  constructor(
    private readonly history: HistoryService,
    private readonly quotesService: QuotesService,
    private readonly watchlistCollectionService: WatchlistCollectionService,
    private readonly instrumentSService: InstrumentsService) {
  }

  unsubscribe() {
    Array.from(this.quotesSubsByKey.keys()).forEach(key => {
      this.quotesSubsByKey.get(key)?.unsubscribe();
      this.quotesSubsByKey.delete(key);
    });

    this.collectionChangeSubscription?.unsubscribe();
    this.instrumentsToWatchSubscription?.unsubscribe();
    this.updateWatchState([]);
  }

  getWatched(settings: InstrumentSelectSettings): Observable<WatchedInstrument[]> {
    return this.watchlistCollectionService.getWatchlistCollection().pipe(
      take(1),
      tap(collection => {
        let displayListId = settings.activeListId;
        if (!displayListId) {
          const defaultList = collection.collection.find(x => x.isDefault);
          displayListId = defaultList?.id;
        }

        if (!displayListId) {
          throw new Error('Watchlist missing');
        }

        this.unsubscribe();

        this.collectionChangeSubscription = this.watchlistCollectionService.getWatchlistCollection()
          .subscribe(currentCollection => {
            const targetWatchlist = currentCollection.collection.find(x => x.id === displayListId);
            if (!targetWatchlist) {
              return;
            }
            this.refreshWatchItems(targetWatchlist.items);
          });


        this.initInstrumentsWatch();
      }),
      switchMap(() => this.watchListUpdates$)
    );
  }

  private refreshWatchItems(items: WatchlistItem[]) {
    const itemKeys = new Set(items.map(x => WatchlistCollectionService.getInstrumentKey(x)));
    for (let [key, sub] of this.quotesSubsByKey) {
      if (!itemKeys.has(key)) {
        sub.unsubscribe();
        this.quotesSubsByKey.delete(key);
        this.removeItemFromState(key);
      }
    }

    this.instrumentsToWatch$.next(items);
  }

  private initInstrumentsWatch() {
    this.instrumentsToWatchSubscription = this.instrumentsToWatch$
      .subscribe(instrumentsToWatch => {
          const notSubscribedInstruments = instrumentsToWatch.filter(instrument => !this.quotesSubsByKey.has(WatchlistCollectionService.getInstrumentKey(instrument)));

          if (notSubscribedInstruments.length === 0) {
            return;
          }

          notSubscribedInstruments.forEach(instrument => {
            this.initInstrumentSubscription(instrument);
          });
        }
      );
  }

  private initInstrumentSubscription(instrument: WatchlistItem) {
    this.instrumentSService.getInstrument(instrument).pipe(
      take(1),
      filter((x): x is Instrument => !!x),
      switchMap(i => {
        return this.history.getLastTwoCandles(i)
          .pipe(
            map(candles => <WatchedInstrument>{
              recordId: instrument.recordId,
              instrument: i,
              closePrice: candles?.prev?.close ?? 0,
              openPrice: candles?.cur.open ?? 0,
              prevTickPrice: 0,
              dayChange: 0,
              price: 0,
              minPrice: candles?.cur?.low,
              maxPrice: candles?.cur?.high,
              volume: candles?.cur?.volume,
              dayChangePerPrice: 0,
            }),
            take(1)
          );
      })
    ).subscribe(wi => {
      this.updateWatchStateItem(wi);
      this.setupInstrumentQuotesSubscription(wi);
    });
  }

  private setupInstrumentQuotesSubscription(wi: WatchedInstrument) {
    const key = WatchlistCollectionService.getInstrumentKey(wi.instrument);

    const sub = this.quotesService.getQuotes(wi.instrument.symbol, wi.instrument.exchange, wi.instrument.instrumentGroup)
      .subscribe(q => {
        const updatedInstrument = <WatchedInstrument>{
          ...wi,
          prevTickPrice: wi.price,
          closePrice: q.prev_close_price,
          openPrice: q.open_price,
          price: q.last_price,
          dayChange: q.change,
          dayChangePerPrice: q.change_percent,
          minPrice: q.low_price,
          maxPrice: q.high_price,
          volume: q.volume
        };

        this.updateWatchStateItem(updatedInstrument);
      });

    this.quotesSubsByKey.set(key, sub);
  }

  private updateWatchStateItem(wi: WatchedInstrument) {
    const key = WatchlistCollectionService.getInstrumentKey(wi.instrument);
    this.updateWatchState([
      ...this.watchListState.filter(x => WatchlistCollectionService.getInstrumentKey(x.instrument) !== key),
      wi
    ]);
  }

  private removeItemFromState(key: string) {
    this.updateWatchState([
      ...this.watchListState.filter(x => WatchlistCollectionService.getInstrumentKey(x.instrument) !== key),
    ]);
  }

  private updateWatchState(watchList: WatchedInstrument[]) {
    this.watchListState = watchList;
    this.watchListStateSubj.next(this.watchListState);
  }
}
