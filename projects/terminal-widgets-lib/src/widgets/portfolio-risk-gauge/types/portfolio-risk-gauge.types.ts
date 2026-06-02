export enum PortfolioRiskStatus {
  Green = 'GREEN',
  Yellow = 'YELLOW',
  Red = 'RED',
  Restricted = 'RESTRICTED',
  Critical = 'CRITICAL',
  ForcedCloseRisk = 'FORCED_CLOSE_RISK',
  NoData = 'NO_DATA'
}

export interface PortfolioRiskGaugeView {
  riskStatus: PortfolioRiskStatus;
  adequacyRatio: number | null;
  gaugeValuePercent: number | null;
}
