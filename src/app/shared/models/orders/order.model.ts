import {Side} from "src/app/shared/models/enums/side.model";

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
  id: string, // 28452595240,
  symbol: string, // SBER,
  portfolio: string, // D39004,
  exchange: string, // MOEX,
  type: string, // limit,
  side: Side, // buy,
  status: string, // working,
  transTime: Date, // 2021-12-28T06:40:46.0000000Z,
  endTime: Date, // 2021-12-28T23:59:59.9990000,
  qtyUnits: number, //10,
  qtyBatch: number, // 1,
  qty: number, //1,
  filledQtyUnits: number, // 0,
  filledQtyBatch: number, // 0,
  filled: number, //0,
  price: number, // 270,
  existing: boolean, // true
  timeInForce?: TimeInForce,
  iceberg?: IcebergParameters | null
}

export interface StopOrder extends Order {
  triggerPrice: number,
  conditionType: string,
  endTime: Date
}

export interface StopOrderResponse extends Omit<StopOrder, ('conditionType' | 'triggerPrice')> {
  stopPrice: number,
  condition: string
}
