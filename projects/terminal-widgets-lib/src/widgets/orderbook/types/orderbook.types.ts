import {InstrumentKey} from '@terminal-core-lib/common/types/instrument.types';
import {ColumnsOrder} from '@terminal-widgets-lib/widgets/orderbook/widget-settings.types';
import {NumberDisplayFormat} from '@terminal-core-lib/common/types/number-display-format.types';
import {PortfolioKey} from '@terminal-core-lib/common/types/portfolio.types';
import {OrderType} from '@terminal-core-lib/features/orders/types/orders.types';
import {Side} from '@terminal-core-lib/common/types/side.types';

export interface ChartPoint {
  x: number; // price
  y: number; // volume
}

export interface ChartData {
  asks: ChartPoint[];
  bids: ChartPoint[];
}

export interface OrderBook {
  rows: OrderBookViewRow[];
  maxVolume: number;
  chartData: ChartData;
  bidVolumes: number;
  askVolumes: number;
}

export interface OrderbookDisplaySettings {
  targetInstrument: InstrumentKey;
  display: {
    depth?: number;
    showChart: boolean;
    showTable: boolean;
    showYieldForBonds: boolean;
    showVolume?: boolean;
    columnsOrder?: ColumnsOrder;
    volumeDisplayFormat?: NumberDisplayFormat;
    showPriceWithZeroPadding?: boolean;
    showSpread?: boolean;
  };
}

export interface CurrentOrder {
  orderId: string;
  ownedPortfolio: PortfolioKey;
  targetInstrument: InstrumentKey;
  volume: number;
  price: number;
  type: OrderType;
  side: Side;
  symbol: string;
}

export interface OrderBookViewRow {
  bidVolume?: number;
  bid?: number;
  yieldBid?: number;
  yieldAsk?: number;
  ask?: number;
  askVolume?: number;
  askOrderVolume?: number;
  bidOrderVolume?: number;

  askOrders: CurrentOrder[];
  bidOrders: CurrentOrder[];
}
