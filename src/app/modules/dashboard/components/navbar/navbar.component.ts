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
import { groupPortfoliosByAgreement } from '../../../../shared/utils/portfolios';
import { DeviceService } from "../../../../shared/services/device.service";

@Component({
  selector: 'ats-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.less'],
})
export class NavbarComponent implements OnInit, OnDestroy {
  deviceInfo$!: Observable<{isMobile: boolean}>;
  isSideMenuVisible = false;

  portfolios$!: Observable<Map<string, PortfolioExtended[]>>;
  selectedPortfolio$!: Observable<PortfolioExtended | null>;
  names = WidgetNames;
  themeColors$!: Observable<ThemeColors>;
  searchControl = new FormControl('');
  private destroy$: Subject<boolean> = new Subject<boolean>();
  private activeInstrument$!: Observable<Instrument>;

  constructor(
    private service: DashboardService,
    private store: Store,
    private auth: AuthService,
    private modal: ModalService,
    private themeService: ThemeService,
    private readonly deviceService: DeviceService
  ) {
  }

  ngOnInit(): void {
    this.deviceInfo$ = this.deviceService.deviceInfo$;

    this.portfolios$ = this.store.select(selectPortfoliosState).pipe(
      filter(p => p.status === EntityStatus.Success),
      map(portfolios => groupPortfoliosByAgreement(Object.values(portfolios.entities).filter((x): x is PortfolioExtended => !!x)))
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
    this.closeSideMenu();
  }

  logout() {
    this.auth.logout();
  }

  changePortfolio(key: PortfolioExtended) {
    this.store.dispatch(selectNewPortfolio({ portfolio: key }));
  }

  addItem(type: string): void {
    DashboardHelper.addWidget(this.service, type);
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

  portfolioGroupsTrackByFn(index: number, item: {key: string, value: PortfolioExtended[]}): string {
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
