import {
  Provider,
  Type
} from '@angular/core';
import {InstrumentInfoWidget} from '@terminal-widgets-lib/widgets/instrument-info/instrument-info-widget/instrument-info-widget';
import {TreemapWidget} from '@terminal-widgets-lib/widgets/treemap/treemap-widget/treemap-widget';
import {WIDGET_COMPONENT_REGISTRY} from '@terminal-core-lib/features/dashboard/types/widget-component-registry.types';
import {OrderbookWidget} from '@terminal-widgets-lib/widgets/orderbook/orderbook-widget/orderbook-widget';
import {LightChartWidget} from '@terminal-widgets-lib/widgets/light-chart/light-chart-widget/light-chart-widget';
import {TechChartWidget} from '@terminal-widgets-lib/widgets/tech-chart/tech-chart-widget/tech-chart-widget';
import {BlotterWidget} from '@terminal-widgets-lib/widgets/blotter/blotter-widget/blotter-widget';
import {OrderSubmitWidget} from '@terminal-widgets-lib/widgets/order-commands/widgets/order-submit-widget/order-submit-widget';
import {OrdersBasketWidget} from '@terminal-widgets-lib/widgets/orders-basket/orders-basket-widget/orders-basket-widget';
import {NewsWidget} from '@terminal-widgets-lib/widgets/news/news-widget/news-widget';
import {ExchangeRateWidget} from '@terminal-widgets-lib/widgets/exchange-rate/exchange-rate-widget/exchange-rate-widget';
import {EventsCalendarWidget} from '@terminal-widgets-lib/widgets/events-calendar/events-calendar-widget/events-calendar-widget';
import {InstrumentTradesWidget} from '@terminal-widgets-lib/widgets/instrument-trades/instrument-trades-widget/instrument-trades-widget';
import {AllInstrumentsWidget} from '@terminal-widgets-lib/widgets/all-instruments/all-instruments-widget/all-instruments-widget';
import {OptionBoardWidget} from '@terminal-widgets-lib/widgets/option-board/option-board-widget/option-board-widget';
import {MobileHomeScreenWidget} from '@terminal-widgets-lib/widgets/mobile-home-screen/mobile-home-screen-widget/mobile-home-screen-widget';
import {MobileTradeScreenWidget} from '@terminal-widgets-lib/widgets/mobile-trade-screen/mobile-trade-screen-widget/mobile-trade-screen-widget';

/**
 * Registry of all widget components available in the mobile terminal.
 * Maps widget type IDs to their component classes.
 */
const MOBILE_WIDGET_REGISTRY: Map<string, Type<unknown>> = new Map<string, Type<unknown>>([
  ['instrument-info', InstrumentInfoWidget],
  ['treemap', TreemapWidget],
  ['order-book', OrderbookWidget],
  ['light-chart', LightChartWidget],
  ['tech-chart', TechChartWidget],
  ['blotter', BlotterWidget],
  ['order-submit', OrderSubmitWidget],
  ['orders-basket', OrdersBasketWidget],
  ['news', NewsWidget],
  ['exchange-rate', ExchangeRateWidget],
  ['events-calendar', EventsCalendarWidget],
  ['all-trades', InstrumentTradesWidget],
  ['all-instruments', AllInstrumentsWidget],
  ['option-board', OptionBoardWidget],
  ['mobile-home-screen', MobileHomeScreenWidget],
  ['trade-screen', MobileTradeScreenWidget],
  // Add new mobile widgets here
]);

/**
 * Provides the mobile widget registry to the application.
 * This ensures only mobile widgets are included in the mobile terminal bundle.
 */
export function provideMobileWidgetRegistry(): Provider[] {
  return [
    {
      provide: WIDGET_COMPONENT_REGISTRY,
      useValue: MOBILE_WIDGET_REGISTRY
    }
  ];
}
