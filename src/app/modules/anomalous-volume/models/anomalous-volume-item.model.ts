export type AnomalyDirection = 'buy' | 'sell' | 'neutral';

export interface AnomalousVolumeItem {
  id: string;
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

