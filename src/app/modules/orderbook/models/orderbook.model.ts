import { OrderBookViewRow } from "./orderbook-view-row.model";

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
