import {Side} from "src/app/shared/models/enums/side.model";

export enum OrderType {
  Market = 'market',
  Limit = 'limit',
  StopMarket = 'stop',
  StopLimit = 'stoplimit'
}

export enum TimeInForce {
  OneDay = 'oneday',
  ImmediateOrCancel = 'immediateorcancel',
  FillOrKill = 'fillorkill',
  AtTheClose = 'attheclose',
  GoodTillCancelled = 'goodtillcancelled'
}

export interface IcebergParameters {
  creationFixedQuantity?: number | null;
  creationVarianceQuantity?: number | null;
  visibleQuantity?: number | null;
  visibleQuantityBatch?: number | null;
  visibleFilledQuantity?: number | null;
  visibleFilledQuantityBatch?: number | null;
}

export interface Order {
  id: string; // 28452595240,
  symbol: string; // SBER,
  exchange: string; // MOEX,
  board: string;
  portfolio: string; // D39004,
  type: OrderType; // limit,
  side: Side; // buy,
  status: string; // working,
  transTime: Date; // 2021-12-28T06:40:46.0000000Z,
  endTime?: Date; // 2021-12-28T23:59:59.9990000,
  qtyUnits: number; // 10,
  qtyBatch: number; // 1,
  qty: number; // 1,
  filledQtyUnits: number; // 0,
  filledQtyBatch?: number; // 0,
  filled?: number; // 0
  price: number; // 270,
  existing: boolean; // true
  volume: number | null;
  timeInForce?: TimeInForce;
  iceberg?: IcebergParameters | null;
  comment?: string;
}

export interface StopOrder extends Order {
  triggerPrice: number;
  conditionType: string;
}

export interface StopOrderResponse extends Omit<StopOrder, ('conditionType' | 'triggerPrice')> {
  stopPrice: number;
  condition: string;
}
