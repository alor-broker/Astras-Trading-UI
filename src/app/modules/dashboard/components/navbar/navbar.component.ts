import {
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';
import {
  Observable,
  Subject,
  take
} from 'rxjs';
import { AuthService } from 'src/app/shared/services/auth.service';
import { DashboardService } from 'src/app/shared/services/dashboard.service';
import { WidgetNames } from 'src/app/shared/models/enums/widget-names';
import { CommandParams } from 'src/app/shared/models/commands/command-params.model';
import { Instrument } from 'src/app/shared/models/instruments/instrument.model';
import { CommandType } from 'src/app/shared/models/enums/command-type.model';
import { ModalService } from 'src/app/shared/services/modal.service';
import { Store } from '@ngrx/store';
import { selectNewPortfolio } from '../../../../store/portfolios/portfolios.actions';
import { joyrideContent } from '../../models/joyride';
import { PortfolioExtended } from 'src/app/shared/models/user/portfolio-extended.model';
import { getSelectedInstrumentByBadge } from "../../../../store/instruments/instruments.selectors";
import { defaultBadgeColor } from "../../../../shared/utils/instruments";
import { ThemeService } from '../../../../shared/services/theme.service';
import { ThemeColors } from '../../../../shared/models/settings/theme-settings.model';
import {
  filter,
  map
} from 'rxjs/operators';
import {
  getSelectedPortfolio,
  selectPortfoliosState
} from '../../../../store/portfolios/portfolios.selectors';
import { EntityStatus } from '../../../../shared/models/enums/entity-status';
import { FormControl } from "@angular/forms";
import { DashboardHelper } from '../../../../shared/utils/dashboard-helper';

@Component({
  selector: 'ats-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.less'],
})
export class NavbarComponent implements OnInit, OnDestroy {
  portfolios$!: Observable<Map<string, PortfolioExtended[]>>;
  selectedPortfolio$!: Observable<PortfolioExtended | null>;
  names = WidgetNames;
  joyrideContent = joyrideContent;
  themeColors$!: Observable<ThemeColors>;
  searchControl = new FormControl('');
  private destroy$: Subject<boolean> = new Subject<boolean>();
  private activeInstrument$!: Observable<Instrument>;

  constructor(
    private service: DashboardService,
    private store: Store,
    private auth: AuthService,
    private modal: ModalService,
    private themeService: ThemeService
  ) {
  }

  ngOnInit(): void {
    this.portfolios$ = this.store.select(selectPortfoliosState).pipe(
      filter(p => p.status === EntityStatus.Success),
      map(portfolios => this.groupPortfolios(Object.values(portfolios.entities).filter((x): x is PortfolioExtended => !!x)))
    );

    this.selectedPortfolio$ = this.store.select(getSelectedPortfolio).pipe(
      map(p => p ?? null)
    );

    this.activeInstrument$ = this.store.select(getSelectedInstrumentByBadge(defaultBadgeColor));

    this.themeColors$ = this.themeService.getThemeSettings().pipe(
      map(x => x.themeColors)
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  isFindedPortfolio(portfolio: PortfolioExtended) {
    const { value } = this.searchControl;
    return !value || (`${portfolio.market} ${portfolio.portfolio}`).toUpperCase().includes(value.toUpperCase());
  }

  resetDashboard() {
    this.service.resetDashboard();
  }

  logout() {
    this.auth.logout();
  }

  changePortfolio(key: PortfolioExtended) {
    setTimeout(() => {
      this.store.dispatch(selectNewPortfolio({ portfolio: key }));
    }, 150);
  }

  addItem(type: string): void {
    DashboardHelper.addWidget(this.service, type);
  }

  newOrder() {
    this.activeInstrument$.pipe(
      take(1)
    ).subscribe(activeInstrument => {
      if (!activeInstrument) {
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

  openThirdPartyLink(link: string) {
    window.open(link, "_blank", 'noopener,noreferrer');
  }

  private groupPortfolios(portfolios: PortfolioExtended[]): Map<string, PortfolioExtended[]> {
    const extendedPortfoliosByAgreement = new Map<string, PortfolioExtended[]>();

    portfolios.forEach(value => {
      const existing = extendedPortfoliosByAgreement.get(value.agreement);
      if (existing) {
        existing.push(value);
      }
      else {
        extendedPortfoliosByAgreement.set(value.agreement, [value]);
      }
    });

    const sortedPortfolios = new Map<string, PortfolioExtended[]>();
    Array.from(extendedPortfoliosByAgreement.keys())
      .sort((a, b) => a.localeCompare(b))
      .forEach(key => {
        const portfolios = extendedPortfoliosByAgreement.get(key)?.sort((a, b) => a.market.localeCompare(b.market)) ?? [];
        sortedPortfolios.set(key, portfolios);
      });

    return sortedPortfolios;
  }
}
