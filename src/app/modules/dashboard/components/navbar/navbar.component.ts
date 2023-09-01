import {
  Component, DestroyRef, OnDestroy,
  OnInit
} from '@angular/core';
import {
  BehaviorSubject,
  delay,
  Observable,
  shareReplay,
  take,
  tap
} from 'rxjs';
import { AuthService } from 'src/app/shared/services/auth.service';
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
import { environment } from "../../../../../environments/environment";
import { NzSegmentedOption } from "ng-zorro-antd/segmented/types";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { CdkDragDrop } from "@angular/cdk/drag-drop";

interface DashboardSegmentedOption extends NzSegmentedOption {
  value: string;
}

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
  favoriteDashboards$!: Observable<DashboardSegmentedOption[]>;
  selectedDashboardIndex$ = new BehaviorSubject<number>(0);

  themeColors$!: Observable<ThemeColors>;
  searchControl = new FormControl('');

  isDashboardSelectionMenuVisible$ = new BehaviorSubject(false);
  private activeInstrument$!: Observable<InstrumentKey | null>;

  constructor(
    private readonly manageDashboardsService: ManageDashboardsService,
    private readonly dashboardContextService: DashboardContextService,
    private readonly store: Store,
    private readonly auth: AuthService,
    private readonly modal: ModalService,
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

    this.favoriteDashboards$ = this.translatorService.getTranslator('dashboard/select-dashboard-menu').pipe(
      mapWith(() => this.manageDashboardsService.allDashboards$, (t, dashboards) => ({ t, dashboards })),
      tap(data => {
        const favDashboardsLength = data.dashboards.filter(d => d.isFavorite).length;

        if (this.selectedDashboardIndex$.getValue() > favDashboardsLength) {
          this.selectedDashboardIndex$.next(favDashboardsLength);
        }
      }),
      delay(50), // used to prevent animation error
      map(({t, dashboards}) => {
          const options: DashboardSegmentedOption[] = dashboards
            .filter(d => d.isFavorite)
            .sort((a, b) => (a.favoritesOrder ?? 0) - (b.favoritesOrder ?? 0))
            .map(d => ({
              value: d.guid,
              label: d.title.includes(DefaultDashboardName) ? d.title.replace(DefaultDashboardName, t(['defaultDashboardName'])) : d.title,
              useTemplate: true
            }));
          options.push({ value: 'dashboardsDropdown', label: 'dashboards dropdown', useTemplate: true, disabled: true });

          return options;
        }
      ),
      shareReplay(1)
    );

    this.selectedDashboard$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        mapWith(
          () => this.favoriteDashboards$,
          (sd, fd) => ({ sd, fd })
        ),
        map(({sd, fd}) => fd.findIndex((d, i) => i === fd.length - 1 ? true : d.value === sd.guid)),
      )
      .subscribe(i => this.selectedDashboardIndex$.next(i));

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

  ngOnDestroy() {
    this.selectedDashboardIndex$.complete();
  }

  changeDashboardSelectionMenuVisibility(value: boolean) {
    setTimeout(() => this.isDashboardSelectionMenuVisible$.next(value));
  }
  isFindedPortfolio(portfolio: PortfolioExtended) {
    const { value } = this.searchControl;
    return !value || (`${portfolio.market} ${portfolio.portfolio}`).toUpperCase().includes(value.toUpperCase());
  }

  selectDashboard(guid: string) {
    this.manageDashboardsService.selectDashboard(<string>guid);
  }

  changeDashboardsOrder(e: CdkDragDrop<any>) {
    this.manageDashboardsService.changeFavoriteDashboardsOrder(e.previousIndex, e.currentIndex);
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

  closeSideMenu(): void {
    this.isSideMenuVisible = false;
  }
}
