export enum PortfolioRiskState {
  Green = 'GREEN',
  Yellow = 'YELLOW',
  Red = 'RED',
  Restricted = 'RESTRICTED',
  Critical = 'CRITICAL',
  ForcedCloseRisk = 'FORCED_CLOSE_RISK',
  NoData = 'NO_DATA'
}

export enum PortfolioRiskComponentKind {
  Npr = 'NPR',
  Forts = 'FORTS'
}

export interface PortfolioRiskComponentView {
  kind: PortfolioRiskComponentKind;
  state: PortfolioRiskState;
  labelKey: string;
  reserveRatio: number | null;
  valueTextKey: string | null;
  gaugeValuePercent: number;
}

export interface PortfolioRiskGaugeView {
  state: PortfolioRiskState;
  labelKey: string;
  reserveRatio: number | null;
  valueTextKey: string | null;
  gaugeValuePercent: number;
  components: PortfolioRiskComponentView[];
}
