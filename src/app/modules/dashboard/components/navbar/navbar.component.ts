import { Component, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subject, takeUntil } from 'rxjs';
import { AuthService } from 'src/app/shared/services/auth.service';
import { AccountService } from '../../services/account.service';
import { DashboardService } from 'src/app/shared/services/dashboard.service';
import { PortfolioKey } from 'src/app/shared/models/portfolio-key.model';
import { WidgetNames } from 'src/app/shared/models/enums/widget-names';
import { buyColor, sellColor } from 'src/app/shared/models/settings/styles-constants';
import { CommandParams } from 'src/app/shared/models/commands/command-params.model';
import { Instrument } from 'src/app/shared/models/instruments/instrument.model';
import { CommandType } from 'src/app/shared/models/enums/command-type.model';
import { ModalService } from 'src/app/shared/services/modal.service';
import { Store } from '@ngrx/store';
import { getSelectedInstrument } from "../../../../shared/ngrx/instruments/instruments.selectors";
import { selectPortfolio } from "../../../../shared/ngrx/portfolios/portfolios.actions";

@Component({
  selector: 'ats-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.less'],
})
export class NavbarComponent implements OnInit, OnDestroy {
  private destroy$: Subject<boolean> = new Subject<boolean>();

  portfolios$!: Observable<PortfolioKey[]>
  names = WidgetNames
  buyColor = buyColor;
  sellColor = sellColor;
  private activeInstrument: Instrument = {
    symbol: 'SBER', exchange: 'MOEX', isin: 'RU0009029540'
  }

  constructor(
    private service: DashboardService,
    private account: AccountService,
    private store: Store,
    private auth: AuthService,
    private modal: ModalService
  ) {
  }

  ngOnInit(): void {
    this.portfolios$ = this.account.getActivePortfolios();

    this.portfolios$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(portfolios => {
      this.changePortfolio(this.selectDefault(portfolios));
    })

    this.store.select(getSelectedInstrument)
      .pipe(
        takeUntil(this.destroy$)
      ).subscribe(i => {
      this.activeInstrument = i;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
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
    this.store.dispatch(selectPortfolio({ portfolio: key }))
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
      price: 1,
      quantity: 1,
      type: CommandType.Limit,
    };
    this.modal.openCommandModal(params);
  }

  openTerminalSettings() {
    this.modal.openTerminalSettingsModal();
  }
}
