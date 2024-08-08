import { Instrument } from '../../../shared/models/instruments/instrument.model';
import { Observable } from 'rxjs';
import { PortfolioKey } from '../../../shared/models/portfolio-key.model';
import { Position } from '../../../shared/models/positions/position.model';
import { ListRange } from '@angular/cdk/collections';
import {
  BodyRow,
  CurrentOrderDisplay,
  LocalOrder
} from './scalper-order-book.model';
import { ScalperOrderBookWidgetSettings } from './scalper-order-book-settings.model';
import { OrderbookData } from '../../orderbook/models/orderbook-data.model';
import { AllTradesItem } from '../../../shared/models/all-trades.model';
import { InstrumentKey } from "../../../shared/models/instruments/instrument-key.model";

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
  readonly trades$: Observable<AllTradesItem[]>;
  readonly workingVolume$: Observable<number>;
  readonly scaleFactor$: Observable<number>;
  displayRange$: Observable<ListRange | null>;

  addLocalOrder(order: LocalOrder): void;
  removeLocalOrder(orderId: string): void;

  destroy(): void;
}
