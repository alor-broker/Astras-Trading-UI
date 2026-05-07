import { Risks } from "../../blotter/models/risks.model";
import { PortfolioRiskState } from "../models/portfolio-risk-gauge.model";
import { PortfolioRiskGaugeCalculator } from "./portfolio-risk-gauge-calculator";

describe('PortfolioRiskGaugeCalculator', () => {
  const createRisk = (
    portfolioEvaluation: number,
    minimalMargin: number
  ): Risks => ({
    portfolio: 'D1234',
    exchange: 'MOEX',
    portfolioEvaluation,
    portfolioLiquidationValue: portfolioEvaluation + 1000,
    initialMargin: minimalMargin * 2,
    minimalMargin,
    correctedMargin: minimalMargin,
    riskCoverageRatioOne: 0,
    riskCoverageRatioTwo: 0,
    riskCategoryId: 1,
    clientType: 'StandardRisk',
    hasForbiddenPositions: false,
    hasNegativeQuantity: false,
    riskStatus: 'Ok'
  });

  it('should classify feedback examples by adequacy ratio', () => {
    expect(PortfolioRiskGaugeCalculator.calculate(createRisk(99980, 38450)).state)
      .toBe(PortfolioRiskState.Green);
    expect(PortfolioRiskGaugeCalculator.calculate(createRisk(99970, 38450)).state)
      .toBe(PortfolioRiskState.Yellow);
    expect(PortfolioRiskGaugeCalculator.calculate(createRisk(76900, 38450)).state)
      .toBe(PortfolioRiskState.Restricted);
    expect(PortfolioRiskGaugeCalculator.calculate(createRisk(46140, 38450)).state)
      .toBe(PortfolioRiskState.Red);
    expect(PortfolioRiskGaugeCalculator.calculate(createRisk(38440, 38450)).state)
      .toBe(PortfolioRiskState.ForcedCloseRisk);
    expect(PortfolioRiskGaugeCalculator.calculate(createRisk(26915, 38450)).state)
      .toBe(PortfolioRiskState.Critical);
  });

  it('should classify exact boundaries inclusively according to risk manager rules', () => {
    expect(PortfolioRiskGaugeCalculator.calculate(createRisk(260, 100)).state)
      .toBe(PortfolioRiskState.Yellow);
    expect(PortfolioRiskGaugeCalculator.calculate(createRisk(200, 100)).state)
      .toBe(PortfolioRiskState.Restricted);
    expect(PortfolioRiskGaugeCalculator.calculate(createRisk(120, 100)).state)
      .toBe(PortfolioRiskState.Red);
    expect(PortfolioRiskGaugeCalculator.calculate(createRisk(100, 100)).state)
      .toBe(PortfolioRiskState.Red);
    expect(PortfolioRiskGaugeCalculator.calculate(createRisk(70, 100)).state)
      .toBe(PortfolioRiskState.Critical);
  });

  it('should keep values above 2.6 green and values below 1 forced-close risk', () => {
    expect(PortfolioRiskGaugeCalculator.calculate(createRisk(261, 100)).state)
      .toBe(PortfolioRiskState.Green);
    expect(PortfolioRiskGaugeCalculator.calculate(createRisk(99, 100)).state)
      .toBe(PortfolioRiskState.ForcedCloseRisk);
  });

  it('should expose adequacy ratio as a decimal multiplier', () => {
    const view = PortfolioRiskGaugeCalculator.calculate(createRisk(150, 100));

    expect(view.adequacyRatio).toBe(1.5);
    expect(view.gaugeValuePercent).toBe(50);
  });

  it('should clamp gauge position at visual cap', () => {
    const view = PortfolioRiskGaugeCalculator.calculate(createRisk(400, 100));

    expect(view.state).toBe(PortfolioRiskState.Green);
    expect(view.gaugeValuePercent).toBe(0);
  });

  it('should show green when minimum margin is not required', () => {
    const view = PortfolioRiskGaugeCalculator.calculate(createRisk(100, 0));

    expect(view.state).toBe(PortfolioRiskState.Green);
    expect(view.adequacyRatio).toBeNull();
    expect(view.valueTextKey).toBe('portfolioRiskGauge.values.noMinimumMarginRequirement');
  });

  it('should return no data for invalid source values', () => {
    expect(PortfolioRiskGaugeCalculator.calculate(createRisk(Number.NaN, 100)).state)
      .toBe(PortfolioRiskState.NoData);
    expect(PortfolioRiskGaugeCalculator.calculate(createRisk(100, Number.NaN)).state)
      .toBe(PortfolioRiskState.NoData);
  });

  it('should treat zero or negative adequacy ratio as critical', () => {
    expect(PortfolioRiskGaugeCalculator.calculate(createRisk(0, 100)).state)
      .toBe(PortfolioRiskState.Critical);
    expect(PortfolioRiskGaugeCalculator.calculate(createRisk(-1, 100)).state)
      .toBe(PortfolioRiskState.Critical);
  });

  it('should use portfolio evaluation instead of liquidation value', () => {
    const risk = createRisk(70, 100);
    risk.portfolioLiquidationValue = 400;

    const view = PortfolioRiskGaugeCalculator.calculate(risk);

    expect(view.state).toBe(PortfolioRiskState.Critical);
    expect(view.adequacyRatio).toBe(0.7);
  });
});
