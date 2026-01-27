import { Component, input, OnInit, inject } from '@angular/core';
import {PositionsComponent} from "../positions/positions.component";
import {WidgetSettingsService} from "../../../../shared/services/widget-settings.service";
import {combineLatest, distinctUntilChanged, Observable} from "rxjs";
import {MobileHomeScreenSettings} from "../../models/mobile-home-screen-settings.model";
import {LetDirective} from "@ngrx/component";
import {Market} from "../../../../../generated/graphql.types";
import {RibbonComponent} from "../../../ribbon/components/ribbon/ribbon.component";
import {PortfolioEvaluationComponent} from "../portfolio-evaluation/portfolio-evaluation.component";
import {InstrumentKey} from "../../../../shared/models/instruments/instrument-key.model";
import {defaultBadgeColor} from "../../../../shared/utils/instruments";
import {NzCollapseComponent, NzCollapsePanelComponent} from "ng-zorro-antd/collapse";
import {TranslocoDirective} from "@jsverse/transloco";
import {NewsComponent} from "../news/news.component";
import {DashboardContextService} from "../../../../shared/services/dashboard-context.service";
import {NavigationStackService} from "../../../../shared/services/navigation-stack.service";
import {
  InvestIdeasCompactComponent
} from "../../../invest-ideas/components/invest-ideas-compact/invest-ideas-compact.component";
import {
  AgreementDynamicsComponent
} from "../../../portfolio-charts/components/agreement-dynamics/agreement-dynamics.component";
import {AsyncPipe} from "@angular/common";
import {UserPortfoliosService} from "../../../../shared/services/user-portfolios.service";
import {filter, map} from "rxjs/operators";
import {isPortfoliosEqual} from "../../../../shared/utils/portfolios";
import {
  DisplayParams,
  MarketTrendsComponent
} from "../../../market-trends/components/market-trends/market-trends.component";

@Component({
  selector: 'ats-mobile-home-screen-content',
  imports: [
    PositionsComponent,
    MarketTrendsComponent,
    LetDirective,
    RibbonComponent,
    PortfolioEvaluationComponent,
    NzCollapseComponent,
    NzCollapsePanelComponent,
    TranslocoDirective,
    NewsComponent,
    InvestIdeasCompactComponent,
    AgreementDynamicsComponent,
    AsyncPipe
  ],
  templateUrl: './mobile-home-screen-content.component.html',
  styleUrl: './mobile-home-screen-content.component.less'
})
export class MobileHomeScreenContentComponent implements OnInit {
  private readonly widgetSettingsService = inject(WidgetSettingsService);
  private readonly dashboardContextService = inject(DashboardContextService);
  private readonly navigationStackService = inject(NavigationStackService);
  private readonly userPortfoliosService = inject(UserPortfoliosService);

  readonly guid = input.required<string>();

  readonly Market = Market;

  currentAgreement$: Observable<string> | null = null;

  protected settings$!: Observable<MobileHomeScreenSettings>;

  ngOnInit(): void {
    this.settings$ = this.widgetSettingsService.getSettings<MobileHomeScreenSettings>(this.guid());
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
    this.dashboardContextService.selectDashboardInstrument(instrumentKey, defaultBadgeColor);
    this.navigationStackService.pushState({
      widgetTarget: {
        typeId: 'mobile-order'
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
      allPortfolios: this.userPortfoliosService.getPortfolios()
    }).pipe(
      map(x => {
        return x.allPortfolios.find(p => isPortfoliosEqual(p, x.selectedPortfolio));
      }),
      filter(p => !!p),
      map(p => p.agreement),
      distinctUntilChanged((previous, current) => previous === current)
    );
  }
}
