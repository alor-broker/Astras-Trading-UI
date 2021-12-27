import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { InstrumentKey } from '../models/instruments/instrument-key.model';

@Injectable({
  providedIn: 'root'
})
export class SyncService {

  private selectedInstrumentSubj = new BehaviorSubject<InstrumentKey>({
    symbol: 'SBER',
    exchange: 'MOEX'
  })

  selectedInstrument$ = this.selectedInstrumentSubj.asObservable();

  constructor() { }

  selectNew(key: InstrumentKey) {
    this.selectedInstrumentSubj.next(key);
  }
}
