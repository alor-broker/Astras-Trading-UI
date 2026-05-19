import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import {
  combineLatest,
  distinctUntilChanged,
  Observable
} from "rxjs";
import {LetDirective} from "@ngrx/component";
import {
  NzCollapseComponent,
  NzCollapsePanelComponent
} from "ng-zorro-antd/collapse";
import {TranslocoDirective} from "@jsverse/transloco";
import {AsyncPipe} from "@angular/common";
import {
  filter,
  map
} from "rxjs/operators";
import {NzButtonComponent} from "ng-zorro-antd/button";
import {NzIconDirective} from "ng-zorro-antd/icon";
import {NzModalModule} from "ng-zorro-antd/modal";
import {DASHBOARD_CONTEXT_SERVICE} from '@terminal-core-lib/features/dashboard/services/dashboard-context-service.types';
import {WidgetSettingsService} from '@terminal-core-lib/features/widget-settings/services/widget-settings.service';
import {NavigationStackService} from '@terminal-core-lib/common/services/navigation-stack.service';
import {PortfoliosStoreFacade} from '@terminal-core-lib/features/portfolios/store/portfolios-store-facade';
import {FEATURES_CONFIG} from '@terminal-core-lib/config/features-config';
import {MobileHomeScreenWidgetSettings} from '@terminal-widgets-lib/widgets/mobile-home-screen/widget-settings.types';
import {InstrumentKey} from '@terminal-core-lib/common/types/instrument.types';
import {DefaultBadge} from '@terminal-core-lib/features/instruments/constants/badges.constants';
import {
  DisplayParams,
  MarketTrends
} from '@terminal-widgets-lib/widgets/market-trends/components/market-trends/market-trends';
import {PortfolioKeyEqualityComparer} from '@terminal-core-lib/common/utils/portfolio-key.helper';
import {Market} from '@terminal-core-lib/features/instruments/graphql/schema/graphql.types';
import {Ribbon} from '@terminal-widgets-lib/widgets/ribbon/components/ribbon/ribbon';
import {MobileHomeScreenPortfolioEvaluation} from '@terminal-widgets-lib/widgets/mobile-home-screen/components/mobile-home-screen-portfolio-evaluation/mobile-home-screen-portfolio-evaluation';
import {MobileHomeScreenPositions} from '@terminal-widgets-lib/widgets/mobile-home-screen/components/mobile-home-screen-positions/mobile-home-screen-positions';
import {AgreementDynamics} from '@terminal-widgets-lib/widgets/portfolio-charts/components/agreement-dynamics/agreement-dynamics';
import {MobileHomeScreenNews} from '@terminal-widgets-lib/widgets/mobile-home-screen/components/mobile-home-screen-news/mobile-home-screen-news';
import {InvestIdeasCompact} from '@terminal-widgets-lib/widgets/invest-ideas/components/invest-ideas-compact/invest-ideas-compact';
import {MoneyOperations} from '@terminal-widgets-lib/widgets/mobile-home-screen/components/money-operations/money-operations/money-operations';
import {OperationsHistory} from '@terminal-widgets-lib/widgets/mobile-home-screen/components/operations-history/operations-history';

@Component({
  selector: 'ats-mobile-home-screen-content',
  imports: [
    LetDirective,
    NzCollapseComponent,
    NzCollapsePanelComponent,
    TranslocoDirective,
    AsyncPipe,
    NzButtonComponent,
    NzIconDirective,
    NzModalModule,
    Ribbon,
    MobileHomeScreenPortfolioEvaluation,
    MobileHomeScreenPositions,
    AgreementDynamics,
    MobileHomeScreenNews,
    MarketTrends,
    InvestIdeasCompact,
    MoneyOperations,
    OperationsHistory
  ],
  templateUrl: './mobile-home-screen-content.html',
  styleUrl: './mobile-home-screen-content.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class MobileHomeScreenContent implements OnInit {
  readonly guid = input.required<string>();

  readonly Market = Market;

  currentAgreement$: Observable<string> | null = null;

  showMoneyOperations = false;

  showHistory = false;

  protected settings$!: Observable<MobileHomeScreenWidgetSettings>;

  private readonly widgetSettingsService = inject(WidgetSettingsService);

  private readonly dashboardContextService = inject(DASHBOARD_CONTEXT_SERVICE);

  private readonly navigationStackService = inject(NavigationStackService);

  private readonly userPortfoliosService = inject(PortfoliosStoreFacade);

  private readonly featuresConfig = inject(FEATURES_CONFIG);

  readonly isMoneyOperationsEnabled = this.featuresConfig.mobileMoneyOperations ?? false;

  ngOnInit(): void {
    this.settings$ = this.widgetSettingsService.getSettings<MobileHomeScreenWidgetSettings>(this.guid());
    this.currentAgreement$ = this.getCurrentAgreement();
  }

  openPortfolioDetails(): void {
    this.navigationStackService.pushState({
      widgetTarget: {
        typeId: 'blotter',
        parameters: {
          activeTab: 'summary'
        }
      }
    });
  }

  openOrder(instrumentKey: InstrumentKey): void {
    this.dashboardContextService.selectDashboardInstrument(instrumentKey, DefaultBadge);
    this.navigationStackService.pushState({
      widgetTarget: {
        typeId: 'trade-screen'
      }
    });
  }

  openNews(): void {
    this.navigationStackService.pushState({
      widgetTarget: {
        typeId: 'news',
        parameters: {
          section: 'portfolio'
        }
      }
    });
  }

  openMoneyOperations(): void {
    this.showMoneyOperations = true;
  }

  closeMoneyOperations(): void {
    this.showMoneyOperations = false;
  }

  openHistory(): void {
    this.showHistory = true;
  }

  closeHistory(): void {
    this.showHistory = false;
  }

  openAllInstruments(displayParams: DisplayParams): void {
    this.navigationStackService.pushState({
      widgetTarget: {
        typeId: 'all-instruments',
        parameters: {
          sort: {
            parameter: 'dailyGrowthPercent',
            order: displayParams.growOrder
          }
        }
      }
    });
  }

  private getCurrentAgreement(): Observable<string> {
    return combineLatest({
      selectedPortfolio: this.dashboardContextService.selectedPortfolio$,
      allPortfolios: this.userPortfoliosService.portfolios$
    }).pipe(
      map(x => {
        return x.allPortfolios.find(p => PortfolioKeyEqualityComparer.equals(p, x.selectedPortfolio));
      }),
      filter(p => !!p),
      map(p => p.agreement),
      distinctUntilChanged((previous, current) => previous === current)
    );
  }
}
