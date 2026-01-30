import {ChangeDetectionStrategy, Component, input, OnDestroy} from '@angular/core';
import {BehaviorSubject} from "rxjs";
import {WidgetInstance} from "../../../../shared/models/dashboard/dashboard-item.model";
import {OrderbookWidgetComponent} from '../../../orderbook/widgets/orderbook-widget/orderbook-widget.component';
import {
  ScalperOrderBookWidgetComponent
} from '../../../scalper-order-book/widgets/scalper-order-book-widget/scalper-order-book-widget.component';
import {LightChartWidgetComponent} from '../../../light-chart/widgets/light-chart-widget/light-chart-widget.component';
import {
  InstrumentSelectWidgetComponent
} from '../../../instruments/widgets/instrument-select-widget/instrument-select-widget.component';
import {BlotterWidgetComponent} from '../../../blotter/widgets/blotter-widget/blotter-widget.component';
import {InfoWidgetComponent} from '../../../info/widgets/info-widget/info-widget.component';
import {AllTradesWidgetComponent} from '../../../all-trades/widgets/all-trades-widget/all-trades-widget.component';
import {NewsWidgetComponent} from '../../../news/widgets/news-widget/news-widget.component';
import {
  ExchangeRateWidgetComponent
} from '../../../exchange-rate/widgets/exchange-rate-widget/exchange-rate-widget.component';
import {TechChartWidgetComponent} from '../../../tech-chart/widgets/tech-chart-widget/tech-chart-widget.component';
import {
  AllInstrumentsWidgetComponent
} from '../../../all-instruments/widgets/all-instruments-widget/all-instruments-widget.component';
import {
  OrderSubmitWidgetComponent
} from '../../../order-commands/widgets/order-submit-widget/order-submit-widget.component';
import {
  OrdersBasketWidgetComponent
} from '../../../orders-basket/widgets/orders-basket-widget/orders-basket-widget.component';
import {TreemapWidgetComponent} from '../../../treemap/widgets/treemap-widget/treemap-widget.component';
import {RibbonWidgetComponent} from '../../../ribbon/widgets/ribbon-widget/ribbon-widget.component';
import {
  EventsCalendarWidgetComponent
} from '../../../events-calendar/widgets/events-calendar-widget/events-calendar-widget.component';
import {
  OptionBoardWidgetComponent
} from '../../../option-board/widgets/option-board-widget/option-board-widget.component';
import {
  ArbitrageSpreadWidgetComponent
} from '../../../arbitrage-spread/widgets/arbitrage-spread-widget/arbitrage-spread-widget.component';
import {
  PortfolioSummaryWidgetComponent
} from '../../../portfolio-summary/widgets/portfolio-summary-widget/portfolio-summary-widget.component';
import {
  InstrumentsCorrelationWidgetComponent
} from '../../../instruments-correlation/widgets/instruments-correlation-widget/instruments-correlation-widget.component';
import {
  BondScreenerWidgetComponent
} from '../../../bond-screener/widgets/bond-screener-widget/bond-screener-widget.component';
import {
  MobileHomeScreenWidgetComponent
} from '../../../mobile-home-screen/widgets/mobile-home-screen-widget/mobile-home-screen-widget.component';
import {AiGraphsWidgetComponent} from '../../../ai-graph/widgets/ai-graphs-widget/ai-graphs-widget.component';
import {
  InvestIdeasWidgetComponent
} from '../../../invest-ideas/widgets/invest-ideas-widget/invest-ideas-widget.component';
import {
  PortfolioChartsWidgetComponent
} from '../../../portfolio-charts/widgets/portfolio-charts-widget/portfolio-charts-widget.component';
import {
  MarketTrendsWidgetComponent
} from '../../../market-trends/widgets/market-trends-widget/market-trends-widget.component';
import {
  AdminClientsWidgetComponent
} from '../../../admin-clients/widgets/admin-clients-widget/admin-clients-widget.component';
import {AsyncPipe} from '@angular/common';
import {
  MobileOrderWidgetComponent
} from "../../../trade-screen/widgets/trade-screen-widget/trade-screen-widget.component";

@Component({
  selector: 'ats-parent-widget',
  templateUrl: './parent-widget.component.html',
  styleUrls: ['./parent-widget.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    OrderbookWidgetComponent,
    ScalperOrderBookWidgetComponent,
    LightChartWidgetComponent,
    InstrumentSelectWidgetComponent,
    BlotterWidgetComponent,
    InfoWidgetComponent,
    AllTradesWidgetComponent,
    NewsWidgetComponent,
    ExchangeRateWidgetComponent,
    TechChartWidgetComponent,
    AllInstrumentsWidgetComponent,
    OrderSubmitWidgetComponent,
    OrdersBasketWidgetComponent,
    TreemapWidgetComponent,
    RibbonWidgetComponent,
    EventsCalendarWidgetComponent,
    OptionBoardWidgetComponent,
    ArbitrageSpreadWidgetComponent,
    PortfolioSummaryWidgetComponent,
    InstrumentsCorrelationWidgetComponent,
    BondScreenerWidgetComponent,
    MobileHomeScreenWidgetComponent,
    AiGraphsWidgetComponent,
    InvestIdeasWidgetComponent,
    PortfolioChartsWidgetComponent,
    MarketTrendsWidgetComponent,
    AdminClientsWidgetComponent,
    AsyncPipe,
    MobileOrderWidgetComponent
  ]
})
export class ParentWidgetComponent implements OnDestroy {
  isWidgetActivated$ = new BehaviorSubject(false);

  readonly widgetInstance = input.required<WidgetInstance>();

  readonly isBlockWidget = input.required<boolean>();

  ngOnDestroy(): void {
    this.isWidgetActivated$.complete();
  }
}
