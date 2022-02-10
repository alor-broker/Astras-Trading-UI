import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CommandParams } from '../models/commands/command-params.model';
import { EditParams } from '../models/commands/edit-params.model';
import { InstrumentKey } from '../models/instruments/instrument-key.model';
import { PortfolioKey } from '../models/portfolio-key.model';

@Injectable({
  providedIn: 'root'
})
export class SyncService {
  private selectedInstrument = new BehaviorSubject<InstrumentKey>({
    symbol: 'SBER',
    exchange: 'MOEX',
    instrumentGroup: 'TQBR'
  })
  private selectedPortfolio = new BehaviorSubject<PortfolioKey | null>(null)
  private shouldShowCommandModal = new BehaviorSubject<boolean>(false)
  private commandParams = new BehaviorSubject<CommandParams | null>(null)

  private editParams = new BehaviorSubject<EditParams | null>(null)
  private shouldShowEditModal = new BehaviorSubject<boolean>(false)

  private shouldShowHelpModal = new BehaviorSubject<boolean>(false)
  private helpParams = new BehaviorSubject<string | null>(null)

  selectedInstrument$ = this.selectedInstrument.asObservable();
  selectedPortfolio$ = this.selectedPortfolio.asObservable();

  shouldShowCommandModal$ = this.shouldShowCommandModal.asObservable();
  commandParams$ = this.commandParams.asObservable();

  editParams$ = this.editParams.asObservable();
  shouldShowEditModal$ = this.shouldShowEditModal.asObservable();

  helpParams$ = this.helpParams.asObservable();
  shouldShowHelpModal$ = this.shouldShowHelpModal.asObservable();

  constructor() {  }

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

  openEditModal(data: EditParams) {
    this.shouldShowEditModal.next(true);
    this.editParams.next(data);
  }

  openHelpModal(widgetName: string) {
    this.shouldShowHelpModal.next(true);
    this.helpParams.next(widgetName);
  }

  closeCommandModal() {
    this.shouldShowCommandModal.next(false);
  }

  closeEditModal() {
    this.shouldShowEditModal.next(false);
  }

  closeHelpModal() {
    this.shouldShowHelpModal.next(false);
  }

  getCurrentlySelectedInstrument() {
    return this.selectedInstrument.getValue();
  }
}
