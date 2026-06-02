import {
  Provider,
  Type
} from '@angular/core';
import {InstrumentInfoWidget} from '@terminal-widgets-lib/widgets/instrument-info/instrument-info-widget/instrument-info-widget';
import {TreemapWidget} from '@terminal-widgets-lib/widgets/treemap/treemap-widget/treemap-widget';
import {WIDGET_COMPONENT_REGISTRY} from '@terminal-core-lib/features/dashboard/types/widget-component-registry.types';
import {WatchlistsWidget} from '@terminal-widgets-lib/widgets/watchlists/watchlists-widget/watchlists-widget';
import {OrderbookWidget} from '@terminal-widgets-lib/widgets/orderbook/orderbook-widget/orderbook-widget';
import {ScalperOrderBookWidget} from '@terminal-widgets-lib/widgets/scalper-order-book/scalper-order-book-widget/scalper-order-book-widget';
import {LightChartWidget} from '@terminal-widgets-lib/widgets/light-chart/light-chart-widget/light-chart-widget';
import {TechChartWidget} from '@terminal-widgets-lib/widgets/tech-chart/tech-chart-widget/tech-chart-widget';
import {BlotterWidget} from '@terminal-widgets-lib/widgets/blotter/blotter-widget/blotter-widget';
import {OrderSubmitWidget} from '@terminal-widgets-lib/widgets/order-commands/widgets/order-submit-widget/order-submit-widget';
import {OrdersBasketWidget} from '@terminal-widgets-lib/widgets/orders-basket/orders-basket-widget/orders-basket-widget';
import {PortfolioSummaryWidget} from '@terminal-widgets-lib/widgets/portfolio-summary/portfolio-summary-widget/portfolio-summary-widget';
import {PortfolioChartsWidget} from '@terminal-widgets-lib/widgets/portfolio-charts/portfolio-charts-widget/portfolio-charts-widget';
import {NewsWidget} from '@terminal-widgets-lib/widgets/news/news-widget/news-widget';
import {ExchangeRateWidget} from '@terminal-widgets-lib/widgets/exchange-rate/exchange-rate-widget/exchange-rate-widget';
import {RibbonWidget} from '@terminal-widgets-lib/widgets/ribbon/ribbon-widget/ribbon-widget';
import {EventsCalendarWidget} from '@terminal-widgets-lib/widgets/events-calendar/events-calendar-widget/events-calendar-widget';
import {InstrumentsCorrelationWidget} from '@terminal-widgets-lib/widgets/instruments-correlation/instruments-correlation-widget/instruments-correlation-widget';
import {BondScreenerWidget} from '@terminal-widgets-lib/widgets/bond-screener/bond-screener-widget/bond-screener-widget';
import {InvestIdeasDesktopWidget} from '@terminal-widgets-lib/widgets/invest-ideas/invest-ideas-desktop-widget/invest-ideas-desktop-widget';
import {MarketTrendsDesktopWidget} from '@terminal-widgets-lib/widgets/market-trends/market-trends-desktop-widget/market-trends-desktop-widget';
import {InstrumentTradesWidget} from '@terminal-widgets-lib/widgets/instrument-trades/instrument-trades-widget/instrument-trades-widget';
import {AllInstrumentsWidget} from '@terminal-widgets-lib/widgets/all-instruments/all-instruments-widget/all-instruments-widget';
import {OptionBoardWidget} from '@terminal-widgets-lib/widgets/option-board/option-board-widget/option-board-widget';
import {ArbitrageSpreadWidget} from '@terminal-widgets-lib/widgets/arbitrage-spread/arbitrage-spread-widget/arbitrage-spread-widget';
import {PortfolioRiskGaugeWidget} from '@terminal-widgets-lib/widgets/portfolio-risk-gauge/portfolio-risk-gauge-widget/portfolio-risk-gauge-widget';

/**
 * Registry of all widget components available in the desktop terminal.
 * Maps widget type IDs to their component classes.
 *
 * Add new desktop widgets here to make them available in the dashboard.
 */
const DESKTOP_WIDGET_REGISTRY: Map<string, Type<any>> = new Map<string, Type<any>>([
  ['instrument-info', InstrumentInfoWidget],
  ['treemap', TreemapWidget],
  ['instrument-select', WatchlistsWidget],
  ['order-book', OrderbookWidget],
  ['scalper-order-book', ScalperOrderBookWidget],
  ['light-chart', LightChartWidget],
  ['tech-chart', TechChartWidget],
  ['blotter', BlotterWidget],
  ['order-submit', OrderSubmitWidget],
  ['orders-basket', OrdersBasketWidget],
  ['portfolio-summary', PortfolioSummaryWidget],
  ['portfolio-charts', PortfolioChartsWidget],
  ['news', NewsWidget],
  ['exchange-rate', ExchangeRateWidget],
  ['ribbon', RibbonWidget],
  ['events-calendar', EventsCalendarWidget],
  ['instruments-correlation', InstrumentsCorrelationWidget],
  ['bond-screener', BondScreenerWidget],
  ['invest-ideas', InvestIdeasDesktopWidget],
  ['market-trends', MarketTrendsDesktopWidget],
  ['all-trades', InstrumentTradesWidget],
  ['all-instruments', AllInstrumentsWidget],
  ['option-board', OptionBoardWidget],
  ['arbitrage-spread', ArbitrageSpreadWidget],
  ['portfolio-risk-gauge', PortfolioRiskGaugeWidget]
  // Add new desktop widgets here
]);

/**
 * Provides the desktop widget registry to the application.
 * This ensures only desktop widgets are included in the desktop terminal bundle.
 */
export function provideDesktopWidgetRegistry(): Provider[] {
  return [
    {
      provide: WIDGET_COMPONENT_REGISTRY,
      useValue: DESKTOP_WIDGET_REGISTRY
    }
  ];
}
