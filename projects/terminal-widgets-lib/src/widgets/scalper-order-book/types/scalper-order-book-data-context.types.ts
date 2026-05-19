import {ScalperOrderBookWidgetSettings} from "../widget-settings.types";
import {
  Instrument,
  InstrumentKey
} from '@terminal-core-lib/common/types/instrument.types';
import {OrderbookData} from '@terminal-core-lib/features/instruments/services/orderbook-service.types';
import {Observable} from 'rxjs';
import {PortfolioKey} from '@terminal-core-lib/common/types/portfolio.types';
import {Position} from '@terminal-core-lib/features/portfolios/types/position.types';
import {
  BodyRow,
  CurrentOrderDisplay,
  LocalOrder
} from '@terminal-widgets-lib/widgets/scalper-order-book/types/scalper-order-book.types';
import {Trade} from '@terminal-core-lib/features/portfolios/types/trade.types';
import {ListRange} from '@angular/cdk/collections';
import {InstrumentTradesItem} from '@terminal-core-lib/features/instruments/services/instrument-trades-service.types';

export interface ScalperOrderBookExtendedSettings {
  widgetSettings: ScalperOrderBookWidgetSettings;
  instrument: Instrument;
}

export interface OrderBook {
  instrumentKey: InstrumentKey;
  rows: OrderbookData;
}

export interface ScalperOrderBookDataContext {
  readonly extendedSettings$: Observable<ScalperOrderBookExtendedSettings>;
  readonly currentPortfolio$: Observable<PortfolioKey>;
  readonly orderBook$: Observable<OrderBook>;
  readonly position$: Observable<Position | null>;
  readonly orderBookBody$: Observable<BodyRow[]>;
  readonly currentOrders$: Observable<CurrentOrderDisplay[]>;
  readonly trades$: Observable<InstrumentTradesItem[]>;
  readonly ownTrades$: Observable<Trade[]>;
  readonly workingVolume$: Observable<number>;
  readonly scaleFactor$: Observable<number>;
  displayRange$: Observable<ListRange | null>;

  addLocalOrder(order: LocalOrder): void;

  removeLocalOrder(orderId: string): void;

  destroy(): void;
}
