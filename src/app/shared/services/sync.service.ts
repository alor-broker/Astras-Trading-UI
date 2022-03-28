import { Injectable } from '@angular/core';
import { BehaviorSubject, distinct, distinctUntilChanged, tap } from 'rxjs';
import { CommandParams } from '../models/commands/command-params.model';
import { EditParams } from '../models/commands/edit-params.model';
import { InstrumentType } from '../models/enums/instrument-type.model';
import { Instrument } from '../models/instruments/instrument.model';
import { PortfolioKey } from '../models/portfolio-key.model';

@Injectable({
  providedIn: 'root'
})
export class SyncService {
  private selectedInstrument = new BehaviorSubject<Instrument>({
    symbol: 'SBER',
    exchange: 'MOEX',
    instrumentGroup: 'TQBR',
    isin: 'RU0009029540'
  })
  private selectedPortfolio = new BehaviorSubject<PortfolioKey | null>(null)

  selectedInstrument$ = this.selectedInstrument.asObservable();
  selectedPortfolio$ = this.selectedPortfolio.asObservable();

  constructor() {  }

  selectNewInstrument(key: Instrument) {
    this.selectedInstrument.next(key);
  }

  selectNewPortfolio(key: PortfolioKey) {
    this.selectedPortfolio.next(key);
  }

  getCurrentlySelectedInstrument() {
    return this.selectedInstrument.getValue();
  }
}
