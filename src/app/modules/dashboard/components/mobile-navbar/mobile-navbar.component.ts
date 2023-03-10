import { Component, OnDestroy, OnInit } from '@angular/core';
import { Observable, shareReplay, Subject } from "rxjs";
import { PortfolioExtended } from "../../../../shared/models/user/portfolio-extended.model";
import { Dashboard } from "../../../../shared/models/dashboard/dashboard.model";
import { FormControl, UntypedFormControl } from "@angular/forms";
import { InstrumentKey } from "../../../../shared/models/instruments/instrument-key.model";
import { DashboardContextService } from "../../../../shared/services/dashboard-context.service";
import { Store } from "@ngrx/store";
import { AuthService } from "../../../../shared/services/auth.service";
import { ModalService } from "../../../../shared/services/modal.service";
import { mapWith } from "../../../../shared/utils/observable-helper";
import { filter, map } from "rxjs/operators";
import { selectPortfoliosState } from "../../../../store/portfolios/portfolios.selectors";
import { EntityStatus } from "../../../../shared/models/enums/entity-status";
import { groupPortfoliosByAgreement } from "../../../../shared/utils/portfolios";
import { defaultBadgeColor } from "../../../../shared/utils/instruments";

@Component({
  selector: 'ats-mobile-navbar',
  templateUrl: './mobile-navbar.component.html',
  styleUrls: ['./mobile-navbar.component.less']
})
export class MobileNavbarComponent implements OnInit, OnDestroy {
  isSideMenuVisible = false;

  portfolios$!: Observable<Map<string, PortfolioExtended[]>>;
  selectedPortfolio$!: Observable<PortfolioExtended | null>;
  selectedDashboard$!: Observable<Dashboard>;
  searchControl = new FormControl('');

  instrumentControl = new UntypedFormControl('');

  private destroy$: Subject<boolean> = new Subject<boolean>();
  private activeInstrument$!: Observable<InstrumentKey | null>;

  constructor(
    private readonly dashboardContextService: DashboardContextService,
    private readonly store: Store,
    private readonly auth: AuthService,
    private readonly modal: ModalService
  ) {
  }

  ngOnInit(): void {
    this.selectedDashboard$ = this.dashboardContextService.selectedDashboard$;

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
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  isFindedPortfolio(portfolio: PortfolioExtended) {
    const { value } = this.searchControl;
    return !value || (`${portfolio.market} ${portfolio.portfolio}`).toUpperCase().includes(value.toUpperCase());
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

  changeInstrument(instrument: InstrumentKey | null) {
    if (instrument) {
      this.dashboardContextService.selectDashboardInstrument(instrument, defaultBadgeColor);
      this.instrumentControl.setValue(null);
    }
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
