export interface Risks {
  portfolio: string;
  exchange: string;
  portfolioEvaluation: number;
  portfolioLiquidationValue: number;
  initialMargin: number;
  minimalMargin: number;
  correctedMargin: number;
  riskCoverageRatioOne: number;
  riskCoverageRatioTwo: number;
  riskCategoryId: number;
  // StandardRisk, HighRisk, Special, LowRisk
  clientType: string;
  hasForbiddenPositions: boolean;
  hasNegativeQuantity: boolean;
  // Ok, Demand, ToClose
  riskStatus: string;
}
