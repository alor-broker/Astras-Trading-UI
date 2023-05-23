import {
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  shareReplay,
  Subject,
  take
} from 'rxjs';
import { AuthService } from 'src/app/shared/services/auth.service';
import { WidgetNames } from 'src/app/shared/models/enums/widget-names';
import { CommandParams } from 'src/app/shared/models/commands/command-params.model';
import { CommandType } from 'src/app/shared/models/enums/command-type.model';
import { ModalService } from 'src/app/shared/services/modal.service';
import { Store } from '@ngrx/store';
import { PortfolioExtended } from 'src/app/shared/models/user/portfolio-extended.model';
import { ThemeService } from '../../../../shared/services/theme.service';
import { ThemeColors } from '../../../../shared/models/settings/theme-settings.model';
import {
  filter,
  map
} from 'rxjs/operators';
import {
  selectPortfoliosState
} from '../../../../store/portfolios/portfolios.selectors';
import { EntityStatus } from '../../../../shared/models/enums/entity-status';
import { FormControl } from "@angular/forms";
import { groupPortfoliosByAgreement } from '../../../../shared/utils/portfolios';
import { ManageDashboardsService } from '../../../../shared/services/manage-dashboards.service';
import { DashboardContextService } from '../../../../shared/services/dashboard-context.service';
import { TranslatorService } from '../../../../shared/services/translator.service';
import {
  Dashboard,
  DefaultDashboardName
} from '../../../../shared/models/dashboard/dashboard.model';
import { mapWith } from '../../../../shared/utils/observable-helper';
import { defaultBadgeColor } from '../../../../shared/utils/instruments';
import { InstrumentKey } from '../../../../shared/models/instruments/instrument-key.model';
import {environment} from "../../../../../environments/environment";

@Component({
  selector: 'ats-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.less'],
})
export class NavbarComponent implements OnInit, OnDestroy {
  readonly externalLinks = environment.externalLinks;

  isSideMenuVisible = false;

  portfolios$!: Observable<Map<string, PortfolioExtended[]>>;
  selectedPortfolio$!: Observable<PortfolioExtended | null>;
  selectedDashboard$!: Observable<Dashboard>;
  names = WidgetNames;
  themeColors$!: Observable<ThemeColors>;
  searchControl = new FormControl('');

  isDashboardSelectionMenuVisible$ = new BehaviorSubject(false);
  private destroy$: Subject<boolean> = new Subject<boolean>();
  private activeInstrument$!: Observable<InstrumentKey | null>;

  constructor(
    private readonly manageDashboardsService: ManageDashboardsService,
    private readonly dashboardContextService: DashboardContextService,
    private readonly store: Store,
    private readonly auth: AuthService,
    private readonly modal: ModalService,
    private readonly themeService: ThemeService,
    private readonly translatorService: TranslatorService
  ) {
  }

  ngOnInit(): void {
    this.selectedDashboard$ = this.translatorService.getTranslator('dashboard/select-dashboard-menu').pipe(
      mapWith(() => this.dashboardContextService.selectedDashboard$, (t, d) => ({ t, d })),
      map(({ t, d }) => ({
        ...d,
        title: d.title === DefaultDashboardName ? t(['defaultDashboardName']) : d.title
      }))
    );

    this.portfolios$ = this.store.select(selectPortfoliosState).pipe(
      filter(p => p.status === EntityStatus.Success),
      map(portfolios => groupPortfoliosByAgreement(Object.values(portfolios.entities).filter((x): x is PortfolioExtended => !!x))),
      shareReplay(1)
    );

    this.selectedPortfolio$ =
      this.selectedDashboard$.pipe(
        map(d => d.selectedPortfolio),
        map(p => p ?? null),
        mapWith(() => this.portfolios$, (selectedKey, all) => ({ selectedKey, all })),
        map(({ selectedKey, all }) => {
          if (!selectedKey) {
            return null;
          }

          return [...all.values()]
            .reduce((c, p) => [...p, ...c], [])
            .find(p => p.portfolio === selectedKey.portfolio
              && p.exchange === selectedKey.exchange
              && p.marketType === selectedKey.marketType
            ) ?? null;
        })
      );

    this.activeInstrument$ = this.dashboardContextService.instrumentsSelection$.pipe(
      map(selection => selection[defaultBadgeColor])
    );

    this.themeColors$ = this.themeService.getThemeSettings().pipe(
      map(x => x.themeColors)
    );
  }

  changeDashboardSelectionMenuVisibility(value: boolean) {
    setTimeout(() => this.isDashboardSelectionMenuVisible$.next(value));
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
    this.manageDashboardsService.resetCurrentDashboard();
    this.closeSideMenu();
  }

  logout() {
    this.auth.logout();
  }

  changePortfolio(key: PortfolioExtended) {
    this.dashboardContextService.selectDashboardPortfolio({
      portfolio: key.portfolio,
      exchange: key.exchange,
      marketType: key.marketType
    });
  }

  addItem(type: string): void {
    this.manageDashboardsService.addWidget(type);
    this.closeSideMenu();
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
    this.closeSideMenu();
  }

  openThirdPartyLink(link: string) {
    window.open(link, "_blank", 'noopener,noreferrer');
  }

  portfolioGroupsTrackByFn(index: number, item: { key: string, value: PortfolioExtended[] }): string {
    return item.key;
  }

  portfoliosTrackByFn(index: number, item: PortfolioExtended) {
    return item.market + item.portfolio;
  }

  openSideMenu(): void {
    this.isSideMenuVisible = true;
  }

  closeSideMenu(): void {
    this.isSideMenuVisible = false;
  }
}
