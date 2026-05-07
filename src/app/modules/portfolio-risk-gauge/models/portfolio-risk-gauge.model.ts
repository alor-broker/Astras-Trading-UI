export enum PortfolioRiskState {
  Green = 'GREEN',
  Yellow = 'YELLOW',
  Red = 'RED',
  Restricted = 'RESTRICTED',
  Critical = 'CRITICAL',
  ForcedCloseRisk = 'FORCED_CLOSE_RISK',
  NoData = 'NO_DATA'
}

export interface PortfolioRiskGaugeView {
  state: PortfolioRiskState;
  labelKey: string;
  adequacyRatio: number | null;
  valueTextKey: string | null;
  gaugeValuePercent: number;
}
