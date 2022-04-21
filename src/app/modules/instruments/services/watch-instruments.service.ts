import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, Subscription } from 'rxjs';
import { map, tap, finalize, mergeMap } from 'rxjs/operators';
import { Instrument } from 'src/app/shared/models/instruments/instrument.model';
import { HistoryService } from 'src/app/shared/services/history.service';
import { QuotesService } from 'src/app/shared/services/quotes.service';
import { WatchedInstrument } from '../models/watched-instrument.model';
import { WebsocketService } from 'src/app/shared/services/websocket.service';
import { getDayChange, getDayChangePerPrice } from 'src/app/shared/utils/price';

@Injectable({
  providedIn: 'root',
})
export class WatchInstrumentsService {
  private watchlistStorage = 'watchlist';

  private newInstruments: Subject<Instrument>;
  newInstruments$: Observable<Instrument>;

  private watchedInstruments : WatchedInstrument[] = [];
  private watchedInstrumentsSubj = new BehaviorSubject<WatchedInstrument[]>(this.watchedInstruments);
  watchedInstruments$ = this.watchedInstrumentsSubj.asObservable();

  private instrumentsToWatch = new BehaviorSubject<Instrument[]>([]);
  instrumentsToWatch$: Observable<Instrument[]> = this.instrumentsToWatch.asObservable();

  private quotesSubsByKey = new Map<string, Subscription>();

  constructor(private history: HistoryService, private ws: WebsocketService) {
    this.newInstruments = new Subject<Instrument>();
    this.newInstruments$ = this.newInstruments.asObservable();
  }

  add(inst: Instrument) {
    if (!this.watchedInstruments.find(i =>
      inst.symbol == i.instrument.symbol
      && inst.exchange == i.instrument.exchange
      && inst.instrumentGroup == i.instrument.instrumentGroup)) {
        this.newInstruments.next(inst);
      }
  }

  remove(instr: Instrument) {
    const key = this.getKey(instr);
    const sub = this.quotesSubsByKey.get(key);
    if (sub) {
      sub.unsubscribe();
      this.watchedInstruments = this.watchedInstruments.filter(i => this.getKey(i.instrument) != key);
      this.watchedInstrumentsSubj.next(this.watchedInstruments);
      this.quotesSubsByKey.delete(key);
    }
  }


  unsubscribe() {
    this.quotesSubsByKey.forEach((v, k) => {
      v.unsubscribe();
    });
  }

  getWatched(): Observable<WatchedInstrument[]> {
    const withCloseSub = this.newInstruments$.pipe(
      mergeMap(i => {
        const candleObs = this.history.getDaysOpen(i);
        const instrObs = candleObs.pipe(
          map((c) : WatchedInstrument => ({
            instrument: i,
            closePrice: c?.close ?? 0,
            prevTickPrice: 0,
            dayChange: 0,
            price: 0,
            dayChangePerPrice: 0,
          }))
        );
        return instrObs;
      }),
      tap(wi => {
        const key = this.getKey(wi.instrument);
        if (!this.quotesSubsByKey.has(key)) {
          const service = new QuotesService(this.ws);
          const sub = service.getQuotes(wi.instrument.symbol, wi.instrument.exchange, wi.instrument.instrumentGroup)
            .pipe(finalize(() => {
              service.unsubscribe();
            }))
            .subscribe(q => {
              const dayChange = getDayChange(q.last_price, wi.closePrice);
              const dayChangePerPrice = getDayChangePerPrice(q.last_price, wi.closePrice);
              const updated = this.watchedInstruments.filter(i => !(
                wi.instrument.symbol == i.instrument.symbol &&
                wi.instrument.exchange == i.instrument.exchange &&
                wi.instrument.instrumentGroup == i.instrument.instrumentGroup));
              if (updated) {
                wi.prevTickPrice = wi.price;
                wi.price = q.last_price;
                wi.dayChange = dayChange;
                wi.dayChangePerPrice = dayChangePerPrice;
                this.watchedInstruments = [...updated, wi].sort((a, b) => a.instrument.symbol.localeCompare(b.instrument.symbol));
              }
              else {
                this.watchedInstruments = [...this.watchedInstruments];
              }
              this.watchedInstrumentsSubj.next(this.watchedInstruments);
            });
          this.quotesSubsByKey.set(key, sub);
        }
      })
    );

    withCloseSub.subscribe(wi => {
      const updated = this.watchedInstruments.filter(i => !(wi.instrument.symbol == i.instrument.symbol && wi.instrument.exchange == i.instrument.exchange));
      if (updated) {
        this.watchedInstruments = [...updated, wi].sort((a, b) => a.instrument.symbol.localeCompare(b.instrument.symbol));
      }
      else {
        this.watchedInstruments = [...this.watchedInstruments];
      }
      this.setWatchlist();
      this.watchedInstrumentsSubj.next(this.watchedInstruments);
    });
    this.getWatchList().forEach(i => this.add(i));
    return this.watchedInstruments$;
  }

  private getKey(key: Instrument) {
    return `${key.exchange}.${key.instrumentGroup}.${key.symbol}`;
  }

  private setWatchlist() {
    const toWatch = this.watchedInstruments.map(wi => wi.instrument);
    localStorage.setItem(this.watchlistStorage, JSON.stringify(toWatch));
  }

  private getWatchList() : Instrument[] {
    const json = localStorage.getItem(this.watchlistStorage);
    let existingList : Instrument[] = [];
    if (json) {
      existingList = JSON.parse(json);
    }
    return existingList;
  }
}
