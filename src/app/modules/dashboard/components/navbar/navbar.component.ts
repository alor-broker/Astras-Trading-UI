import { Component, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subject, take, takeUntil } from 'rxjs';
import { AuthService } from 'src/app/shared/services/auth.service';
import { AccountService } from '../../../../shared/services/account.service';
import { DashboardService } from 'src/app/shared/services/dashboard.service';
import { WidgetNames } from 'src/app/shared/models/enums/widget-names';
import { buyColor, sellColor } from 'src/app/shared/models/settings/styles-constants';
import { CommandParams } from 'src/app/shared/models/commands/command-params.model';
import { Instrument } from 'src/app/shared/models/instruments/instrument.model';
import { CommandType } from 'src/app/shared/models/enums/command-type.model';
import { ModalService } from 'src/app/shared/services/modal.service';
import { Store } from '@ngrx/store';
import { getSelectedInstrument } from '../../../../store/instruments/instruments.selectors';
import { selectNewPortfolio } from '../../../../store/portfolios/portfolios.actions';
import { joyrideContent } from '../../models/joyride';
import { PortfolioExtended } from 'src/app/shared/models/user/portfolio-extended.model';

@Component({
  selector: 'ats-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.less'],
})
export class NavbarComponent implements OnInit, OnDestroy {
  portfolios$!: Observable<Map<string, PortfolioExtended[]>>;
  names = WidgetNames;
  buyColor = buyColor;
  sellColor = sellColor;
  joyrideContent = joyrideContent;
  private destroy$: Subject<boolean> = new Subject<boolean>();
  private activeInstrument$!: Observable<Instrument>;

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
    });

    this.activeInstrument$ = this.store.select(getSelectedInstrument);
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  clear() {
    this.service.clearDashboard();
  }

  logout() {
    this.auth.logout();
  }

  selectDefault(portfoliosByAgreement: Map<string, PortfolioExtended[]>) {
    let portfolios = [...portfoliosByAgreement.values()].flat();
    let result = portfolios.find(p => p.exchange == 'MOEX' && p.portfolio.startsWith('D')) ?? portfoliosByAgreement.values().next().value;
    return result;
  }

  changePortfolio(key: PortfolioExtended) {
    this.store.dispatch(selectNewPortfolio({ portfolio: key }));
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
    this.activeInstrument$.pipe(
      take(1)
    ).subscribe(activeInstrument => {
      if(!activeInstrument) {
        throw new Error('Instrument is not selected');
      }

      const params: CommandParams = {
        instrument: { ...activeInstrument },
        price: 1,
        quantity: 1,
        type: CommandType.Limit,
      };
      this.modal.openCommandModal(params);
    });
  }

  openTerminalSettings() {
    this.modal.openTerminalSettingsModal();
  }
}
