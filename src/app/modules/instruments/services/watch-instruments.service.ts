import { Injectable } from '@angular/core';
import { BehaviorSubject, filter, Observable, Subscription, take } from 'rxjs';
import { finalize, map } from 'rxjs/operators';
import { Instrument } from 'src/app/shared/models/instruments/instrument.model';
import { HistoryService } from 'src/app/shared/services/history.service';
import { QuotesService } from 'src/app/shared/services/quotes.service';
import { WatchedInstrument } from '../models/watched-instrument.model';
import { WebsocketService } from 'src/app/shared/services/websocket.service';
import { getDayChange, getDayChangePerPrice } from 'src/app/shared/utils/price';
import { GuidGenerator } from '../../../shared/utils/guid';

@Injectable()
export class WatchInstrumentsService {
  private readonly quitesSubscriptionId = GuidGenerator.newGuid();
  private readonly watchlistStorage = 'watchlist';

  private watchListState: WatchedInstrument[] = [];
  private readonly watchListStateSubj = new BehaviorSubject<WatchedInstrument[]>(this.watchListState);
  private watchListUpdates$ = this.watchListStateSubj.asObservable()
    .pipe(
      map(x => x.sort((a, b) => a.instrument.symbol.localeCompare(b.instrument.symbol)))
    );

  private readonly instrumentsToWatch$: BehaviorSubject<Instrument[]>;
  private instrumentsToWatchSubscription?: Subscription;
  private readonly quotesSubsByKey = new Map<string, Subscription>();

  constructor(private history: HistoryService, private ws: WebsocketService) {
    this.instrumentsToWatch$ = new BehaviorSubject<Instrument[]>(this.getSavedWatchList());

    this.instrumentsToWatch$.subscribe(instruments => {
      this.saveWatchlist(instruments);
    });
  }

  private static getKey(instrument: Instrument) {
    return `${instrument.exchange}.${instrument.instrumentGroup}.${instrument.symbol}`;
  }

  add(instr: Instrument) {
    const instrumentKey = WatchInstrumentsService.getKey(instr);
    this.instrumentsToWatch$.pipe(
      take(1),
      filter(i => !i.find(x => instrumentKey === WatchInstrumentsService.getKey(x)))
    ).subscribe(instruments => {
      const instrumentsToWatch = [...instruments, { ...instr }];
      this.instrumentsToWatch$.next(instrumentsToWatch);
    });
  }

  remove(instr: Instrument) {
    this.instrumentsToWatch$.pipe(
      take(1),
    ).subscribe(instruments => {
      const instrumentKey = WatchInstrumentsService.getKey(instr);
      const sub = this.quotesSubsByKey.get(instrumentKey);
      if (sub) {
        sub.unsubscribe();
        this.quotesSubsByKey.delete(instrumentKey);
      }

      this.updateWatchState(this.watchListState.filter(x => WatchInstrumentsService.getKey(x.instrument) !== instrumentKey));
      this.instrumentsToWatch$.next(instruments.filter(x => instrumentKey !== WatchInstrumentsService.getKey(x)));
    });
  }

  unsubscribe() {
    Array.from(this.quotesSubsByKey.keys()).forEach(key => {
      this.quotesSubsByKey.get(key)?.unsubscribe();
      this.quotesSubsByKey.delete(key);
    });

    this.updateWatchState([]);
  }

  getWatched(): Observable<WatchedInstrument[]> {
    this.initInstrumentsWatch();
    return this.watchListUpdates$;
  }

  private initInstrumentsWatch() {
    if (!!this.instrumentsToWatchSubscription) {
      this.instrumentsToWatchSubscription.unsubscribe();
    }

    this.instrumentsToWatchSubscription = this.instrumentsToWatch$
      .subscribe(instrumentsToWatch => {
          const notSubscribedInstruments = instrumentsToWatch.filter(instrument => !this.quotesSubsByKey.has(WatchInstrumentsService.getKey(instrument)));

          if (notSubscribedInstruments.length === 0) {
            return;
          }

          notSubscribedInstruments.forEach(instrument => {
            if (this.quotesSubsByKey.has(WatchInstrumentsService.getKey(instrument))) {
              return;
            }

            this.initInstrumentSubscription(instrument);
          });
        }
      );
  }

  private initInstrumentSubscription(instrument: Instrument) {
    this.history.getDaysOpen(instrument)
      .pipe(
        map(candle => <WatchedInstrument>{
          instrument: instrument,
          closePrice: candle?.close ?? 0,
          prevTickPrice: 0,
          dayChange: 0,
          price: 0,
          dayChangePerPrice: 0,
        }),
        take(1)
      ).subscribe(wi => {
      this.updateWatchStateItem(wi);
      this.setupInstrumentQuotesSubscription(wi);
    });
  }

  private setupInstrumentQuotesSubscription(wi: WatchedInstrument) {
    const key = WatchInstrumentsService.getKey(wi.instrument);

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
    const key = WatchInstrumentsService.getKey(wi.instrument);
    this.updateWatchState([
      ...this.watchListState.filter(x => WatchInstrumentsService.getKey(x.instrument) !== key),
      wi
    ]);
  }

  private updateWatchState(watchList: WatchedInstrument[]) {
    this.watchListState = watchList;
    this.watchListStateSubj.next(this.watchListState);
  }

  private saveWatchlist(instruments: Instrument[]) {
    localStorage.setItem(this.watchlistStorage, JSON.stringify(instruments));
  }

  private getSavedWatchList(): Instrument[] {
    const json = localStorage.getItem(this.watchlistStorage);
    let existingList: Instrument[] = [];
    if (json) {
      existingList = JSON.parse(json);
    }
    return existingList;
  }
}
