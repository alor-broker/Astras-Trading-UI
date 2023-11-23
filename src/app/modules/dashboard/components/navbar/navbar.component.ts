import { Component, DestroyRef, OnInit } from '@angular/core';
import { Observable, shareReplay, take } from 'rxjs';
import { AuthService } from 'src/app/shared/services/auth.service';
import { ModalService } from 'src/app/shared/services/modal.service';
import { Store } from '@ngrx/store';
import { PortfolioExtended } from 'src/app/shared/models/user/portfolio-extended.model';
import { ThemeService } from '../../../../shared/services/theme.service';
import { ThemeColors } from '../../../../shared/models/settings/theme-settings.model';
import { filter, map } from 'rxjs/operators';
import { EntityStatus } from '../../../../shared/models/enums/entity-status';
import { FormControl } from "@angular/forms";
import { groupPortfoliosByAgreement } from '../../../../shared/utils/portfolios';
import { ManageDashboardsService } from '../../../../shared/services/manage-dashboards.service';
import { DashboardContextService } from '../../../../shared/services/dashboard-context.service';
import { TranslatorService } from '../../../../shared/services/translator.service';
import { Dashboard, DefaultDashboardName } from '../../../../shared/models/dashboard/dashboard.model';
import { mapWith } from '../../../../shared/utils/observable-helper';
import { defaultBadgeColor, toInstrumentKey } from '../../../../shared/utils/instruments';
import { InstrumentKey } from '../../../../shared/models/instruments/instrument-key.model';
import { environment } from "../../../../../environments/environment";
import { OrdersDialogService } from "../../../../shared/services/orders/orders-dialog.service";
import { OrderType } from "../../../../shared/models/orders/orders-dialog.model";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { PortfoliosFeature } from "../../../../store/portfolios/portfolios.reducer";

@Component({
  selector: 'ats-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.less'],
})
export class NavbarComponent implements OnInit {
  readonly externalLinks = environment.externalLinks;

  isSideMenuVisible = false;

  portfolios$!: Observable<Map<string, PortfolioExtended[]>>;
  selectedPortfolio$!: Observable<PortfolioExtended | null>;
  selectedDashboard$!: Observable<Dashboard>;

  themeColors$!: Observable<ThemeColors>;
  searchControl = new FormControl('');

  private activeInstrument$!: Observable<InstrumentKey | null>;

  constructor(
    private readonly manageDashboardsService: ManageDashboardsService,
    private readonly dashboardContextService: DashboardContextService,
    private readonly store: Store,
    private readonly auth: AuthService,
    private readonly modal: ModalService,
    private readonly ordersDialogService: OrdersDialogService,
    private readonly themeService: ThemeService,
    private readonly translatorService: TranslatorService,
    private readonly destroyRef: DestroyRef
  ) {
  }

  ngOnInit(): void {
    this.selectedDashboard$ = this.translatorService.getTranslator('dashboard/select-dashboard-menu').pipe(
      mapWith(() => this.dashboardContextService.selectedDashboard$, (t, d) => ({ t, d })),
      map(({ t, d }) => ({
        ...d,
        title: d.title.includes(DefaultDashboardName) ? d.title.replace(DefaultDashboardName, t(['defaultDashboardName']))  : d.title
      })),
      shareReplay(1)
    );

    this.portfolios$ = this.store.select(PortfoliosFeature.selectPortfoliosState).pipe(
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

    this.portfolios$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(portfolios => {
        const hasActivePortfolios = Array.from(portfolios.values()).some(p => p.length > 0);

        if (!hasActivePortfolios) {
          this.modal.openEmptyPortfoliosWarningModal();
        }
      });

    this.activeInstrument$ = this.dashboardContextService.instrumentsSelection$.pipe(
      map(selection => selection[defaultBadgeColor])
    );

    this.themeColors$ = this.themeService.getThemeSettings().pipe(
      map(x => x.themeColors)
    );
  }

  isFindedPortfolio(portfolio: PortfolioExtended): boolean {
    const { value } = this.searchControl;
    return !(value ?? '') || (`${portfolio.market} ${portfolio.portfolio}`).toUpperCase().includes((value as string).toUpperCase());
  }

  resetDashboard(): void {
    this.manageDashboardsService.resetCurrentDashboard();
    this.closeSideMenu();
  }

  logout(): void {
    this.auth.logout();
  }

  changePortfolio(key: PortfolioExtended): void {
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

  newOrder(): void {
    this.activeInstrument$.pipe(
      take(1)
    ).subscribe(activeInstrument => {
      if (!activeInstrument) {
        throw new Error('Instrument is not selected');
      }

      this.ordersDialogService.openNewOrderDialog({
        instrumentKey: toInstrumentKey(activeInstrument),
        initialValues: {
          orderType: OrderType.Limit,
          quantity: 1
        }
      });
    });
  }

  openTerminalSettings(): void {
    this.modal.openTerminalSettingsModal();
    this.closeSideMenu();
  }

  openThirdPartyLink(link: string): void {
    window.open(link, "_blank", 'noopener,noreferrer');
  }

  portfolioGroupsTrackByFn(index: number, item: { key: string, value: PortfolioExtended[] }): string {
    return item.key;
  }

  portfoliosTrackByFn(index: number, item: PortfolioExtended): string {
    return item.market + item.portfolio;
  }

  closeSideMenu(): void {
    this.isSideMenuVisible = false;
  }
}
