import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subscription, take, tap } from 'rxjs';
import { finalize, map } from 'rxjs/operators';
import { HistoryService } from 'src/app/shared/services/history.service';
import { QuotesService } from 'src/app/shared/services/quotes.service';
import { WatchedInstrument } from '../models/watched-instrument.model';
import { WebsocketService } from 'src/app/shared/services/websocket.service';
import { getDayChange, getDayChangePerPrice } from 'src/app/shared/utils/price';
import { GuidGenerator } from '../../../shared/utils/guid';
import { InstrumentKey } from '../../../shared/models/instruments/instrument-key.model';
import { WatchlistCollectionService } from './watchlist-collection.service';
import { BaseService } from '../../../shared/services/base.service';
import { InstrumentSelectSettings } from '../../../shared/models/settings/instrument-select-settings.model';
import { DashboardService } from '../../../shared/services/dashboard.service';

@Injectable()
export class WatchInstrumentsService extends BaseService<InstrumentSelectSettings> {
  private readonly quitesSubscriptionId = GuidGenerator.newGuid();
  private listId?: string;


  private watchListState: WatchedInstrument[] = [];
  private readonly watchListStateSubj = new BehaviorSubject<WatchedInstrument[]>(this.watchListState);
  private watchListUpdates$ = this.watchListStateSubj.asObservable()
    .pipe(
      map(x => x.sort((a, b) => a.instrument.symbol.localeCompare(b.instrument.symbol)))
    );

  private readonly instrumentsToWatch$ = new BehaviorSubject<InstrumentKey[]>([]);
  private readonly quotesSubsByKey = new Map<string, Subscription>();
  private instrumentsToWatchSubscription?: Subscription;
  private collectionChangeSubscription?: Subscription;


  constructor(
    settingsService: DashboardService,
    private readonly history: HistoryService,
    private readonly ws: WebsocketService,
    private readonly watchlistCollectionService: WatchlistCollectionService) {
    super(settingsService);
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
    this.listId = settings.activeListId;
    const collection = this.watchlistCollectionService.getWatchlistCollection();
    if (!this.listId) {
      const defaultList = collection.collection.find(x => x.isDefault);
      this.listId = defaultList?.id;
    }

    if (!this.listId) {
      throw new Error('Watchlist missing');
    }

    this.unsubscribe();
    this.refreshWatchItems();
    this.collectionChangeSubscription = this.watchlistCollectionService.collectionChanged$.subscribe(() => this.refreshWatchItems());
    this.initInstrumentsWatch();

    return this.watchListUpdates$;
  }

  getSettings(guid: string): Observable<InstrumentSelectSettings> {
    return super.getSettings(guid).pipe(
      tap(s => this.settings = {
        ...s,
        // need to specify properties below for backward compatibility
        // linkToActive and activeListId are missing by default so equal function do not process them correctly
        linkToActive: s.linkToActive,
        activeListId: s.activeListId
      } as InstrumentSelectSettings)
    );
  }

  private refreshWatchItems() {
    if (!this.listId) {
      return;
    }

    const items = this.watchlistCollectionService.getListItems(this.listId);

    if (!items) {
      return;
    }

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

  private initInstrumentSubscription(instrument: InstrumentKey) {
    this.history.getDaysOpen(instrument)
      .pipe(
        map(candle => <WatchedInstrument>{
          instrument: instrument,
          closePrice: candle?.close ?? 0,
          openPrice: candle?.open ?? 0,
          prevTickPrice: 0,
          dayChange: 0,
          price: 0,
          minPrice: candle.low,
          maxPrice: candle.high,
          volume: candle.volume,
          dayChangePerPrice: 0,
        }),
        take(1)
      ).subscribe(wi => {
      this.updateWatchStateItem(wi);
      this.setupInstrumentQuotesSubscription(wi);
    });
  }

  private setupInstrumentQuotesSubscription(wi: WatchedInstrument) {
    const key = WatchlistCollectionService.getInstrumentKey(wi.instrument);

    const service = new QuotesService(this.ws);
    const sub = service.getQuotes(wi.instrument.symbol, wi.instrument.exchange, wi.instrument.instrumentGroup, this.quitesSubscriptionId)
      .pipe(finalize(() => {
        service.unsubscribe();
      }))
      .subscribe(q => {
        const dayChange = getDayChange(q.last_price, wi.closePrice);
        const dayChangePerPrice = getDayChangePerPrice(q.last_price, wi.closePrice);
        const updatedInstrument = <WatchedInstrument>{
          ...wi,
          prevTickPrice: wi.price,
          price: q.last_price,
          dayChange,
          dayChangePerPrice
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
