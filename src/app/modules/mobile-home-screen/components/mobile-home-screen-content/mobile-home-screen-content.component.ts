import {
  Component,
  Input,
  OnInit
} from '@angular/core';
import { PortfolioDynamicsComponent } from "../portfolio-dynamics/portfolio-dynamics.component";
import { PositionsComponent } from "../positions/positions.component";
import {
  DisplayParams,
  MarketTrendsComponent
} from "../market-trends/market-trends.component";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { Observable } from "rxjs";
import { MobileHomeScreenSettings } from "../../models/mobile-home-screen-settings.model";
import { LetDirective } from "@ngrx/component";
import { Market } from "../../../../../generated/graphql.types";
import { RibbonComponent } from "../../../ribbon/components/ribbon/ribbon.component";
import { PortfolioEvaluationComponent } from "../portfolio-evaluation/portfolio-evaluation.component";
import { InstrumentKey } from "../../../../shared/models/instruments/instrument-key.model";
import { defaultBadgeColor } from "../../../../shared/utils/instruments";
import {
  NzCollapseComponent,
  NzCollapsePanelComponent
} from "ng-zorro-antd/collapse";
import { TranslocoDirective } from "@jsverse/transloco";
import { NewsComponent } from "../news/news.component";
import { IdeasComponent } from "../ideas/ideas.component";
import { DashboardContextService } from "../../../../shared/services/dashboard-context.service";
import { NavigationStackService } from "../../../../shared/services/navigation-stack.service";

@Component({
  selector: 'ats-mobile-home-screen-content',
  imports: [
    PortfolioDynamicsComponent,
    PositionsComponent,
    MarketTrendsComponent,
    LetDirective,
    RibbonComponent,
    PortfolioEvaluationComponent,
    NzCollapseComponent,
    NzCollapsePanelComponent,
    TranslocoDirective,
    NewsComponent,
    IdeasComponent
  ],
  templateUrl: './mobile-home-screen-content.component.html',
  styleUrl: './mobile-home-screen-content.component.less'
})
export class MobileHomeScreenContentComponent implements OnInit {
  @Input({required: true})
  guid!: string;

  readonly Market = Market;

  protected settings$!: Observable<MobileHomeScreenSettings>;

  constructor(
    private readonly widgetSettingsService: WidgetSettingsService,
    private readonly dashboardContextService: DashboardContextService,
    private readonly navigationStackService: NavigationStackService,
  ) {
  }

  ngOnInit(): void {
    this.settings$ = this.widgetSettingsService.getSettings<MobileHomeScreenSettings>(this.guid);
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

  openChart(instrumentKey: InstrumentKey): void {
    this.dashboardContextService.selectDashboardInstrument(instrumentKey, defaultBadgeColor);
    this.navigationStackService.pushState({
      widgetTarget: {
        typeId: 'light-chart'
      }
    });
  }

  openOrder(instrumentKey: InstrumentKey): void {
    this.dashboardContextService.selectDashboardInstrument(instrumentKey, defaultBadgeColor);
    this.navigationStackService.pushState({
      widgetTarget: {
        typeId: 'order-submit'
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
}
