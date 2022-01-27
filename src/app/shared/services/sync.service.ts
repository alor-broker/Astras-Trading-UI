import { Injectable } from '@angular/core';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { BehaviorSubject } from 'rxjs';
import { CommandParams } from '../models/commands/command-params.model';
import { InstrumentKey } from '../models/instruments/instrument-key.model';
import { PortfolioKey } from '../models/portfolio-key.model';

@Injectable({
  providedIn: 'root'
})
export class SyncService {

  private selectedInstrument = new BehaviorSubject<InstrumentKey>({
    symbol: 'SBER',
    exchange: 'MOEX'
  })
  private selectedPortfolio = new BehaviorSubject<PortfolioKey | null>(null)
  private shouldShowCommandModal = new BehaviorSubject<boolean>(false)
  private commandParams = new BehaviorSubject<CommandParams | null>(null)

  selectedInstrument$ = this.selectedInstrument.asObservable();
  selectedPortfolio$ = this.selectedPortfolio.asObservable();
  shouldShowCommandModal$ = this.shouldShowCommandModal.asObservable();
  commandParams$ = this.commandParams.asObservable();

  constructor(private notification: NzNotificationService) { }

  selectNewInstrument(key: InstrumentKey) {
    this.selectedInstrument.next(key);
  }

  selectNewPortfolio(key: PortfolioKey) {
    this.selectedPortfolio.next(key);
  }

  openCommandModal(data: CommandParams) {
    this.shouldShowCommandModal.next(true);
    const portfolio = this.selectedPortfolio.getValue();
    if (portfolio) {
      this.commandParams.next({
        ...data,
        user: portfolio
      });
    }
  }

  closeCommandModal() {
    this.shouldShowCommandModal.next(false);
  }

  getCurrentlySelectedInstrument() {
    return this.selectedInstrument.getValue();
  }
}
