import {Risks} from '@terminal-core-lib/features/portfolios/types/portfolio-summary.types';
import {
  PortfolioRiskGaugeView,
  PortfolioRiskStatus
} from '@terminal-widgets-lib/widgets/portfolio-risk-gauge/types/portfolio-risk-gauge.types';

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
        PortfolioRiskStatus.Green,
        null,
      );
    }

    const adequacyRatio = liquidPortfolio / minimalMargin;

    return this.toView(
      this.getStateByAdequacyRatio(adequacyRatio),
      adequacyRatio
    );
  }

  static noData(): PortfolioRiskGaugeView {
    return this.toView(
      PortfolioRiskStatus.NoData,
      null
    );
  }

  private static getStateByAdequacyRatio(adequacyRatio: number): PortfolioRiskStatus {
    if (adequacyRatio <= 0.7) {
      return PortfolioRiskStatus.Critical;
    }

    if (adequacyRatio < 1) {
      return PortfolioRiskStatus.ForcedCloseRisk;
    }

    if (adequacyRatio <= 1.2) {
      return PortfolioRiskStatus.Red;
    }

    if (adequacyRatio <= 2) {
      return PortfolioRiskStatus.Restricted;
    }

    if (adequacyRatio <= 2.6) {
      return PortfolioRiskStatus.Yellow;
    }

    return PortfolioRiskStatus.Green;
  }

  private static toView(
    state: PortfolioRiskStatus,
    adequacyRatio: number | null,
  ): PortfolioRiskGaugeView {
    return {
      riskStatus: state,
      adequacyRatio,
      gaugeValuePercent: adequacyRatio != null
        ? this.toGaugeValuePercent(adequacyRatio)
        : null
    };
  }

  private static toGaugeValuePercent(adequacyRatio: number): number {
    return Math.min(Math.max((visualAdequacyCap - adequacyRatio) / visualAdequacyCap * 100, 0), 100);
  }
}
