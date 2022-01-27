import { Side } from "src/app/shared/models/enums/side.model";

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
  existing: boolean // true
}
