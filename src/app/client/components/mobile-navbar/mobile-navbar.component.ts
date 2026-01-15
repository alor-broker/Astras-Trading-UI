import { Component, OnInit, inject } from "@angular/core";
import { Observable } from "rxjs";
import {SESSION_CONTEXT, SessionContext} from "../../../shared/services/auth/session-context";
import {Store} from "@ngrx/store";
import {FormControl, ReactiveFormsModule} from "@angular/forms";
import {ModalService} from "../../../shared/services/modal.service";
import {HelpService} from "../../../shared/services/help.service";
import {PortfoliosFeature} from "../../../store/portfolios/portfolios.reducer";
import {filter, map, shareReplay, take} from "rxjs/operators";
import {EntityStatus} from "../../../shared/models/enums/entity-status";
import {groupPortfoliosByAgreement} from "../../../shared/utils/portfolios";
import {PortfolioExtended} from "../../../shared/models/user/portfolio-extended.model";
import { mapWith } from "src/app/shared/utils/observable-helper";
import { InstrumentKey } from "src/app/shared/models/instruments/instrument-key.model";
import {defaultBadgeColor} from "../../../shared/utils/instruments";
import { NewYearHelper } from "src/app/modules/dashboard/utils/new-year.helper";
import {DashboardContextService} from "../../../shared/services/dashboard-context.service";
import {Dashboard} from "../../../shared/models/dashboard/dashboard.model";
import {EnvironmentService} from "../../../shared/services/environment.service";
import {NzHeaderComponent} from "ng-zorro-antd/layout";
import {TranslocoDirective} from "@jsverse/transloco";
import {RouterLink} from "@angular/router";
import {NzIconDirective} from "ng-zorro-antd/icon";
import { AsyncPipe, KeyValuePipe, NgTemplateOutlet } from "@angular/common";
import {NzButtonComponent} from "ng-zorro-antd/button";
import {NzDropDownDirective, NzDropdownMenuComponent} from "ng-zorro-antd/dropdown";
import {JoyrideModule} from "ngx-joyride";
import {NzPopoverDirective} from "ng-zorro-antd/popover";
import {NzMenuDirective, NzMenuDividerDirective, NzMenuItemComponent} from "ng-zorro-antd/menu";
import {NzInputDirective} from "ng-zorro-antd/input";
import {NzDrawerComponent, NzDrawerContentDirective} from "ng-zorro-antd/drawer";
import {InstrumentSearchComponent} from "../../../shared/components/instrument-search/instrument-search.component";
import {
  NetworkIndicatorComponent
} from "../../../modules/dashboard/components/network-indicator/network-indicator.component";
import {ExternalLinkComponent} from "../../../shared/components/external-link/external-link.component";
import {
  NotificationButtonComponent
} from "../../../modules/notifications/components/notification-button/notification-button.component";
import { LangSwitchWidgetComponent } from "../../../modules/terminal-settings/widgets/lang-switch-widget/lang-switch-widget.component";

@Component({
    selector: 'ats-mobile-navbar',
    templateUrl: './mobile-navbar.component.html',
    styleUrls: ['./mobile-navbar.component.less'],
  imports: [
    NzHeaderComponent,
    TranslocoDirective,
    RouterLink,
    NzIconDirective,
    AsyncPipe,
    NzButtonComponent,
    NzDropDownDirective,
    JoyrideModule,
    NzPopoverDirective,
    NzDropdownMenuComponent,
    NzMenuDirective,
    NzInputDirective,
    KeyValuePipe,
    NzMenuItemComponent,
    ReactiveFormsModule,
    NzDrawerComponent,
    NzDrawerContentDirective,
    NzMenuDividerDirective,
    NgTemplateOutlet,
    InstrumentSearchComponent,
    NetworkIndicatorComponent,
    ExternalLinkComponent,
      NotificationButtonComponent,
      LangSwitchWidgetComponent
  ]
})
export class MobileNavbarComponent implements OnInit {
  private readonly environmentService = inject(EnvironmentService);
  private readonly dashboardContextService = inject(DashboardContextService);
  private readonly store = inject(Store);
  private readonly sessionContext = inject<SessionContext>(SESSION_CONTEXT);
  private readonly modal = inject(ModalService);
  private readonly helpService = inject(HelpService);

  isSideMenuVisible = false;
  readonly externalLinks = this.environmentService.externalLinks;
  helpLink$!: Observable<string | null>;
  portfolios$!: Observable<Map<string, PortfolioExtended[]>>;
  selectedPortfolio$!: Observable<PortfolioExtended | null>;
  selectedDashboard$!: Observable<Dashboard>;
  portfolioSearchControl = new FormControl('');
  instrumentSearchControl = new FormControl('');

  ngOnInit(): void {
    this.selectedDashboard$ = this.dashboardContextService.selectedDashboard$;

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
            .find(p => {
                return p.portfolio === selectedKey.portfolio
                  && p.exchange === selectedKey.exchange
                  && p.marketType === selectedKey.marketType;
              }
            ) ?? null;
        })
      );

    this.portfolios$
      .pipe(
        take(1),
      )
      .subscribe(portfolios => {
        const hasActivePortfolios = Array.from(portfolios.values()).some(p => p.length > 0);

        if (!hasActivePortfolios) {
        //  this.modal.openEmptyPortfoliosWarningModal();
        }
      });

    this.helpLink$ = this.helpService.getSectionHelp('main');
  }

  isFindedPortfolio(portfolio: PortfolioExtended): boolean {
    const { value } = this.portfolioSearchControl;
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
      this.dashboardContextService.selectDashboardInstrument(instrument, defaultBadgeColor);
      this.instrumentSearchControl.setValue(null);
    }
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

  openSideMenu(): void {
    this.isSideMenuVisible = true;
  }

  closeSideMenu(): void {
    this.isSideMenuVisible = false;
  }

  showNewYearIcon = NewYearHelper.showNewYearIcon;

  isNullOrEmpty(value: string | null | undefined): boolean {
    return value == null || value.length === 0;
  }
}
