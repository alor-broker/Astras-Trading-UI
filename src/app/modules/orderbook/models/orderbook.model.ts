import { OrderBookViewRow } from "./orderbook-view-row.model";

export interface ChartPoint {
  x: number, // price
  y: number  // volume
}

export interface ChartData {
  asks: ChartPoint[],
  bids: ChartPoint[],
  minPrice: number,
  maxPrice: number,
}

export interface OrderBook {
  rows: Array<OrderBookViewRow>,
  maxVolume: number,
  chartData: ChartData
}
