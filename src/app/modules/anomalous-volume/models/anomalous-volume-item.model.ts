export type AnomalyDirection = 'buy' | 'sell';
export type AnomalousVolumeEventType = 'anomaly' | 'large-trade';

export interface AnomalousVolumeItem {
  id: string;
  eventType: AnomalousVolumeEventType;
  ticker: string;
  instrument: string;
  direction: AnomalyDirection;
  lots: number;
  moneyVolume: number;
  changePercent: number;
  buyPercent: number;
  sellPercent: number;
  date: string;
  time: string;
  detectedAt: number;
  sigmaScore: number;
}
