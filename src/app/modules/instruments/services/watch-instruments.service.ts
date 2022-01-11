import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable, of } from 'rxjs';
import { map, mergeMap, switchMap } from 'rxjs/operators';
import { InstrumentKey } from 'src/app/shared/models/instruments/instrument-key.model';
import { HistoryService } from 'src/app/shared/services/history.service';
import { WatchedInstrument } from '../models/watched-instrument.model';

@Injectable({
  providedIn: 'root',
})
export class WatchInstrumentsService {
  private watchedInstrumentsSubj = new BehaviorSubject<InstrumentKey[]>([
    { symbol: 'GAZP', exchange: 'MOEX' },
  ]);

  watchedInstruments$: Observable<InstrumentKey[]> = this.watchedInstrumentsSubj.asObservable();

  constructor(private history: HistoryService) {}

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
              dayChange: c.close,
              price: 0,
              dayChangePerPrice: 0,
            }))
          )
          return instrObs;
        });
        const combined =  combineLatest(obs);
        return combined;
      })
    )
  }
}
