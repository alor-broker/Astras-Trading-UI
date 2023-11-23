export interface Position {
  symbol: string; // SBER,
  brokerSymbol: string; // MOEX:SBER,
  portfolio: string; // D39004,
  exchange: string; // MOEX,
  avgPrice: number; // 290,
  qtyUnits: number; // 10.00,
  openUnits: number; // 10.00,
  lotSize: number; // 10,
  shortName: string; // Сбербанк,
  qtyT0: number; // 10.00,
  qtyT1: number; // 10.00,
  qtyT2: number; // 10.00,
  qtyTFuture: number; // 10.00,
  qtyT0Batch: number; // 1,
  qtyT1Batch: number; // 1,
  qtyT2Batch: number; // 1,
  qtyTFutureBatch: number; // 1,
  qtyBatch: number; // 1,
  openQtyBatch: number; // 1,
  qty: number; // 1,
  open: number; // 1,
  dailyUnrealisedPl: number; // 4.200,
  unrealisedPl: number; // 292.600,
  isCurrency: boolean; // false
  volume: number;
  currentVolume: number;
}
