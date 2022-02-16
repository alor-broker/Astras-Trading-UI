import { Component, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { AuthService } from 'src/app/shared/services/auth.service';
import { AccountService } from '../../services/account.service';
import { DashboardService } from 'src/app/shared/services/dashboard.service';
import { SyncService } from 'src/app/shared/services/sync.service';
import { PortfolioKey } from 'src/app/shared/models/portfolio-key.model';
import { WidgetNames } from 'src/app/shared/models/enums/widget-names';
import { buyColor, sellColor } from 'src/app/shared/models/settings/styles-constants';
import { CommandParams } from 'src/app/shared/models/commands/command-params.model';
import { Instrument } from 'src/app/shared/models/instruments/instrument.model';
import { CommandType } from 'src/app/shared/models/enums/command-type.model';
import { ModalService } from 'src/app/shared/services/modal.service';

@Component({
  selector: 'ats-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.less'],
})
export class NavbarComponent implements OnInit, OnDestroy {
  portfolios$!: Observable<PortfolioKey[]>
  names = WidgetNames
  constructor(
    private service: DashboardService,
    private account: AccountService,
    private sync: SyncService,
    private auth: AuthService,
    private modal: ModalService
  ) { }

  buyColor = buyColor;
  sellColor = sellColor;

  private instrumentSub?: Subscription;
  private portfolioSub?: Subscription;
  private activeInstrument: Instrument = {
    symbol: 'SBER', exchange: 'MOEX', isin: 'RU0009029540'
  }

  ngOnInit(): void {
    this.portfolios$ = this.account.getActivePortfolios();
    this.instrumentSub = this.portfolios$.subscribe(portfolios => {
      this.changePortfolio(this.selectDefault(portfolios));
    })
    this.instrumentSub = this.sync.selectedInstrument$.subscribe(i => {
      this.activeInstrument = i;
    });
  }

  ngOnDestroy(): void {
    this.instrumentSub?.unsubscribe();
    this.portfolioSub?.unsubscribe();
  }

  clear() {
    this.service.clearDashboard();
  }

  logout() {
    this.auth.logout()
  }

  selectDefault(portfolios: PortfolioKey[]) {
    return portfolios.find(p => p.exchange == 'MOEX' && p.portfolio.startsWith('D')) ?? portfolios[0];
  }

  changePortfolio(key: PortfolioKey) {
    this.sync.selectNewPortfolio(key);
  }

  addItem(type: string): void {
    this.service.addWidget({
      gridItem: {
        x: 0,
        y: 0,
        cols: 1,
        rows: 1,
        type: type,
      },
    });
  }

  newOrder() {
    const params: CommandParams = {
      instrument: { ...this.activeInstrument },
      price: 0,
      quantity: 0,
      type: CommandType.Limit,
    };
    this.modal.openCommandModal(params);
  }

  openTerminalSettings() {
    this.modal.openTerminalSettingsModal();
  }
}
