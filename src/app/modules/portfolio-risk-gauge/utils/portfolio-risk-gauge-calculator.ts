import { Risks } from "../../blotter/models/risks.model";
import {
  PortfolioRiskGaugeView,
  PortfolioRiskState
} from "../models/portfolio-risk-gauge.model";

const visualAdequacyCap = 3;

export class PortfolioRiskGaugeCalculator {
  static calculate(risk: Risks): PortfolioRiskGaugeView {
    const liquidPortfolio = risk.portfolioEvaluation;
    const minimalMargin = risk.minimalMargin;

    if (!Number.isFinite(liquidPortfolio) || !Number.isFinite(minimalMargin)) {
      return this.noData();
    }

    if (minimalMargin <= 0) {
      return this.toView(
        PortfolioRiskState.Green,
        null,
        'portfolioRiskGauge.values.noMinimumMarginRequirement'
      );
    }

    const adequacyRatio = liquidPortfolio / minimalMargin;

    return this.toView(
      this.getStateByAdequacyRatio(adequacyRatio),
      adequacyRatio
    );
  }

  static noData(): PortfolioRiskGaugeView {
    return {
      state: PortfolioRiskState.NoData,
      labelKey: this.getStateLabelKey(PortfolioRiskState.NoData),
      adequacyRatio: null,
      valueTextKey: 'portfolioRiskGauge.values.noData',
      gaugeValuePercent: 0
    };
  }

  private static getStateByAdequacyRatio(adequacyRatio: number): PortfolioRiskState {
    if (adequacyRatio <= 0.7) {
      return PortfolioRiskState.Critical;
    }

    if (adequacyRatio < 1) {
      return PortfolioRiskState.ForcedCloseRisk;
    }

    if (adequacyRatio <= 1.2) {
      return PortfolioRiskState.Red;
    }

    if (adequacyRatio <= 2) {
      return PortfolioRiskState.Restricted;
    }

    if (adequacyRatio <= 2.6) {
      return PortfolioRiskState.Yellow;
    }

    return PortfolioRiskState.Green;
  }

  private static toView(
    state: PortfolioRiskState,
    adequacyRatio: number | null,
    valueTextKey: string | null = null
  ): PortfolioRiskGaugeView {
    return {
      state,
      labelKey: this.getStateLabelKey(state),
      adequacyRatio,
      valueTextKey,
      gaugeValuePercent: this.toGaugeValuePercent(adequacyRatio)
    };
  }

  private static toGaugeValuePercent(adequacyRatio: number | null): number {
    if (adequacyRatio == null) {
      return 0;
    }

    return Math.min(Math.max((visualAdequacyCap - adequacyRatio) / visualAdequacyCap * 100, 0), 100);
  }

  private static getStateLabelKey(state: PortfolioRiskState): string {
    return `portfolioRiskGauge.states.${state}`;
  }
}
