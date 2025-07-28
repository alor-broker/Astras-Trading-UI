import {
  Component,
  Inject,
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
import { WidgetsSwitcherService } from "../../../../shared/services/widgets-switcher.service";
import { InstrumentKey } from "../../../../shared/models/instruments/instrument-key.model";
import {
  ACTIONS_CONTEXT,
  ActionsContext
} from "../../../../shared/services/actions-context";
import { defaultBadgeColor } from "../../../../shared/utils/instruments";
import {
  NzCollapseComponent,
  NzCollapsePanelComponent
} from "ng-zorro-antd/collapse";
import { TranslocoDirective } from "@jsverse/transloco";
import { NewsComponent } from "../news/news.component";

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
    NewsComponent
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
    private readonly widgetsSwitcherService: WidgetsSwitcherService,
    @Inject(ACTIONS_CONTEXT)
    private readonly actionsContext: ActionsContext,
  ) {
  }

  ngOnInit(): void {
    this.settings$ = this.widgetSettingsService.getSettings<MobileHomeScreenSettings>(this.guid);
  }

  openPortfolioDetails(): void {
    this.widgetsSwitcherService.activateWidget({
      identifier: {
        typeId: 'blotter'
      },
      parameters: {
        activeTab: 'summary'
      },
      sourceWidgetInstanceId: this.guid
    });
  }

  openChart(instrumentKey: InstrumentKey): void {
    this.actionsContext.selectInstrument(instrumentKey, defaultBadgeColor);
    this.widgetsSwitcherService.activateWidget({
      identifier: {
        typeId: 'light-chart'
      },
      sourceWidgetInstanceId: this.guid
    });
  }

  openNews(): void {
    this.widgetsSwitcherService.activateWidget({
      identifier: {
        typeId: 'news'
      },
      parameters: {
        section: 'portfolio'
      },
      sourceWidgetInstanceId: this.guid
    });
  }

  openAllInstruments(displayParams: DisplayParams): void {
    this.widgetsSwitcherService.activateWidget({
      identifier: {
        typeId: 'all-instruments'
      },
      parameters: {
        sort: {
          parameter: 'dailyGrowthPercent',
          order: displayParams.growOrder
        }
      },
      sourceWidgetInstanceId: this.guid
    });
  }
}
