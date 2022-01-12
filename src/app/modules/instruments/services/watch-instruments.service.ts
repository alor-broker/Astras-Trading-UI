import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, concat, forkJoin, from, merge, Observable, of, zip } from 'rxjs';
import { combineAll, concatAll, concatMap, exhaustMap, flatMap, map, mergeAll, mergeMap, switchAll, switchMap, take, withLatestFrom } from 'rxjs/operators';
import { InstrumentKey } from 'src/app/shared/models/instruments/instrument-key.model';
import { HistoryService } from 'src/app/shared/services/history.service';
import { QuotesService } from 'src/app/shared/services/quotes.service';
import { MathHelper } from 'src/app/shared/utils/math-helper';
import { WatchedInstrument } from '../models/watched-instrument.model';

@Injectable({
  providedIn: 'root',
})
export class WatchInstrumentsService {
  private watchedInstrumentsSubj = new BehaviorSubject<InstrumentKey[]>([
    { symbol: 'GAZP', exchange: 'MOEX' },
  ]);

  watchedInstruments$: Observable<InstrumentKey[]> = this.watchedInstrumentsSubj.asObservable();

  constructor(private history: HistoryService, private quotesService: QuotesService) {

  }

  add(inst: InstrumentKey) {
    const existing = this.watchedInstrumentsSubj.getValue();
    if (!existing.find((e) => e.symbol == inst.symbol && e.exchange == inst.exchange && e.instrumentGroup == inst.instrumentGroup))
    {
      const insts = [...this.watchedInstrumentsSubj.getValue(), inst];
      this.watchedInstrumentsSubj.next(insts);
    }
  }

  remove(inst: InstrumentKey) {
    const existing = this.watchedInstrumentsSubj.getValue();
    const updated = existing.filter(e =>
      !(e.symbol == inst.symbol && e.exchange == inst.exchange && e.instrumentGroup == inst.instrumentGroup)
    );

    this.watchedInstrumentsSubj.next(updated);
  }

  getWatched(): Observable<WatchedInstrument[]> {
    return this.watchedInstruments$.pipe(
      switchMap(instruments => {
        const obs = instruments.map(i => {
          const candleObs = this.history.getDaysOpen(i);
          const instrObs = candleObs.pipe(
            map((c) : WatchedInstrument => ({
              instrument: i,
              closePrice: c.close,
              dayChange: 0,
              price: 0,
              dayChangePerPrice: 0,
            }))
          )
          return instrObs;
        });
        const combined =  combineLatest(obs);
        return combined;
      }),
      s => this.enrichWithQuotes(s, this.quotesService)
    )
  }

  private enrichWithQuotes(source$: Observable<WatchedInstrument[]>, quotes: QuotesService) : Observable<WatchedInstrument[]> {
    return source$.pipe(
      switchMap(instruments => {
        const obs = instruments.map(i => {
          const quotes$ = quotes.getQuotes(i.instrument.symbol, i.instrument.exchange, i.instrument.instrumentGroup);
          const instr$ = quotes$.pipe(
            map((q) : WatchedInstrument => ({
              ...i,
              price: q.last_price,
              dayChange: MathHelper.round((q.last_price - i.closePrice), 2),
              dayChangePerPrice: MathHelper.round((1 - (i.closePrice / q.last_price)), 4)
            }))
          )
          return instr$;
        });
        // const p = merge(obs);
        const t = combineLatest(obs)
        return t;
      })
    )
  }
}
function combineLatestAll(obs: Observable<WatchedInstrument>[]) {
  throw new Error('Function not implemented.');
}

function combineLatestWith(obs: Observable<WatchedInstrument>[]) {
  throw new Error('Function not implemented.');
}

