import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
  ViewEncapsulation
} from '@angular/core';
import {PortfolioExtended} from "@terminal-core-lib/common/types/portfolio.types";
import {Dashboard} from "@terminal-core-lib/features/dashboard/types/dashboard.types";
import {
  map,
  Observable,
  shareReplay
} from "rxjs";
import {NewYearHelper} from '@terminal-core-lib/common/utils/new-year.helper';
import {
  FormControl,
  ReactiveFormsModule
} from '@angular/forms';
import {EXTERNAL_LINKS_CONFIG} from '@terminal-core-lib/features/external-links/external-links.types';
import {MobileDashboardContextService} from '../../features/dashboard/services/mobile-dashboard-context.service';
import {SESSION_CONTEXT} from '@terminal-core-lib/features/user-context/user-context.types';
import {HelpService} from '@terminal-core-lib/features/help-docs/services/help.service';
import {PortfolioHelper} from '@terminal-core-lib/common/utils/portfolio.helper';
import {PortfoliosStoreFacade} from '@terminal-core-lib/features/portfolios/store/portfolios-store-facade';
import {mapWith} from '@terminal-core-lib/common/utils/observable/map-with';
import {InstrumentKey} from '@terminal-core-lib/common/types/instrument.types';
import {DefaultBadge} from '@terminal-core-lib/features/instruments/constants/badges.constants';
import {TranslocoDirective} from '@jsverse/transloco';
import {RouterLink} from '@angular/router';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {
  AsyncPipe,
  KeyValue,
  KeyValuePipe,
  NgTemplateOutlet
} from '@angular/common';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {
  NzDropdownDirective,
  NzDropdownMenuComponent
} from 'ng-zorro-antd/dropdown';
import {NzPopoverDirective} from 'ng-zorro-antd/popover';
import {ExternalLink} from '@terminal-core-lib/features/external-links/components/external-link/external-link';
import {
  NzMenuDirective,
  NzMenuDividerDirective,
  NzMenuItemComponent
} from 'ng-zorro-antd/menu';
import {NzInputDirective} from 'ng-zorro-antd/input';
import {NetworkIndicator} from '@terminal-core-lib/features/network-indicator/components/network-indicator/network-indicator';
import {NotificationsNavBtn} from '@terminal-core-lib/features/header-notifications/components/notifications-nav-btn/notifications-nav-btn';
import {NavLangSwitch} from '@terminal-core-lib/features/terminal-settings/components/nav-lang-switch/nav-lang-switch';
import {
  NzDrawerComponent,
  NzDrawerContentDirective
} from 'ng-zorro-antd/drawer';
import {InlineInstrumentSearch} from '@terminal-core-lib/features/instruments/components/inline-instrument-search/inline-instrument-search';
import {TerminalSettingsDialog} from '@terminal-core-lib/features/terminal-settings/components/terminal-settings-dialog/terminal-settings-dialog';

@Component({
  selector: 'atsm-navbar',
  imports: [
    TranslocoDirective,
    RouterLink,
    NzIconDirective,
    AsyncPipe,
    NzButtonComponent,
    NzDropdownDirective,
    NzPopoverDirective,
    ExternalLink,
    NzDropdownMenuComponent,
    NzMenuDirective,
    NzInputDirective,
    ReactiveFormsModule,
    KeyValuePipe,
    NetworkIndicator,
    NotificationsNavBtn,
    NavLangSwitch,
    NzDrawerComponent,
    NzDrawerContentDirective,
    NzMenuItemComponent,
    NzMenuDividerDirective,
    NgTemplateOutlet,
    InlineInstrumentSearch,
    TerminalSettingsDialog
  ],
  templateUrl: './navbar.html',
  styleUrl: './navbar.less',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Navbar implements OnInit {
  protected portfolios$!: Observable<Map<string, PortfolioExtended[]>>;

  protected selectedPortfolio$!: Observable<PortfolioExtended | null>;

  protected selectedDashboard$!: Observable<Dashboard>;

  protected portfolioSearchControl = new FormControl('');

  protected instrumentSearchControl = new FormControl('');

  protected showNewYearIcon = NewYearHelper.showNewYearIcon;

  protected readonly externalLinksConfig = inject(EXTERNAL_LINKS_CONFIG);

  protected readonly showTerminalSettings = signal(false);

  protected readonly isSideMenuVisible = signal(false);

  private readonly portfoliosStoreFacade = inject(PortfoliosStoreFacade);

  private readonly dashboardContextService = inject(MobileDashboardContextService);

  private readonly sessionContext = inject(SESSION_CONTEXT);

  private readonly helpService = inject(HelpService);

  protected readonly helpLink$ = this.helpService.getSectionHelp('main');

  ngOnInit(): void {
    this.selectedDashboard$ = this.dashboardContextService.selectedDashboard$;

    this.portfolios$ = this.portfoliosStoreFacade.portfolios$.pipe(
      map(portfolios => PortfolioHelper.groupPortfoliosByAgreement(portfolios)),
      shareReplay(1)
    );

    this.selectedPortfolio$ =
      this.selectedDashboard$.pipe(
        map(d => d.selectedPortfolio),
        map(p => p ?? null),
        mapWith(() => this.portfolios$, (selectedKey, all) => ({selectedKey, all})),
        map(({selectedKey, all}) => {
          if (!selectedKey) {
            return null;
          }

          return [...all.values()]
            .reduce((c, p) => [...p, ...c], [])
            .find(p => {
                return p.portfolio === selectedKey.portfolio
                  && p.exchange === selectedKey.exchange
                  && p.marketType === selectedKey.marketType;
              }
            ) ?? null;
        })
      );
  }

  isFindedPortfolio(portfolio: PortfolioExtended): boolean {
    const {value} = this.portfolioSearchControl;
    return value == null || (`${portfolio.market} ${portfolio.portfolio}`).toUpperCase().includes((value).toUpperCase());
  }

  logout(): void {
    this.sessionContext.logout();
  }

  changePortfolio(key: PortfolioExtended): void {
    this.dashboardContextService.selectDashboardPortfolio({
      portfolio: key.portfolio,
      exchange: key.exchange,
      marketType: key.marketType
    });
  }

  changeInstrument(instrument: InstrumentKey | null): void {
    if (instrument) {
      this.dashboardContextService.selectDashboardInstrument(instrument, DefaultBadge);
      this.instrumentSearchControl.setValue(null);
    }
  }

  openTerminalSettings(): void {
    this.showTerminalSettings.set(true);
    this.closeSideMenu();
  }

  openThirdPartyLink(link: string): void {
    window.open(link, "_blank", 'noopener,noreferrer');
  }

  portfolioGroupsTrackByFn(index: number, item: KeyValue<string, PortfolioExtended[]>): string {
    return item.key;
  }

  portfoliosTrackByFn(index: number, item: PortfolioExtended): string {
    return item.market + item.portfolio;
  }

  openSideMenu(): void {
    this.isSideMenuVisible.set(true);
  }

  closeSideMenu(): void {
    this.isSideMenuVisible.set(false);
  }

  isNullOrEmpty(value: string | null | undefined): boolean {
    return value == null || value.length === 0;
  }
}
