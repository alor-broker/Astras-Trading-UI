import { ForwardRisks } from "../../blotter/models/forward-risks.model";
import { Risks } from "../../blotter/models/risks.model";
import {
  PortfolioRiskComponentKind,
  PortfolioRiskComponentView,
  PortfolioRiskGaugeView,
  PortfolioRiskState
} from "../models/portfolio-risk-gauge.model";

const minHealthyReserveRatio = 0.5;
const minWarningReserveRatio = 0.2;
const eps = 1;

const stateSeverity: Record<PortfolioRiskState, number> = {
  [PortfolioRiskState.Green]: 0,
  [PortfolioRiskState.Yellow]: 1,
  [PortfolioRiskState.Red]: 2,
  [PortfolioRiskState.Restricted]: 3,
  [PortfolioRiskState.Critical]: 4,
  [PortfolioRiskState.ForcedCloseRisk]: 5,
  [PortfolioRiskState.NoData]: -1
};

export class PortfolioRiskGaugeCalculator {
  static calculateNpr(risk: Risks): PortfolioRiskComponentView {
    const npr1 = risk.riskCoverageRatioOne ?? 0;
    const npr2 = risk.riskCoverageRatioTwo ?? 0;
    const initialMargin = risk.initialMargin ?? 0;

    if (risk.riskStatus === 'ToClose' || npr2 <= 0) {
      return this.toComponent(
        PortfolioRiskComponentKind.Npr,
        PortfolioRiskState.ForcedCloseRisk,
        this.getSafeRatio(npr1, initialMargin),
        null,
        100
      );
    }

    if (risk.riskStatus === 'Demand' || npr1 <= 0) {
      return this.toComponent(
        PortfolioRiskComponentKind.Npr,
        PortfolioRiskState.Restricted,
        this.getSafeRatio(npr1, initialMargin),
        null,
        100
      );
    }

    if (initialMargin <= 0) {
      return this.toComponent(
        PortfolioRiskComponentKind.Npr,
        PortfolioRiskState.Green,
        null,
        'portfolioRiskGauge.values.noMarginRisk'
      );
    }

    return this.toComponent(
      PortfolioRiskComponentKind.Npr,
      this.getStateByReserveRatio(npr1 / Math.max(initialMargin, eps)),
      npr1 / Math.max(initialMargin, eps)
    );
  }

  static calculateForts(fortsRisk: ForwardRisks): PortfolioRiskComponentView {
    const moneyFree = fortsRisk.moneyFree ?? 0;
    const moneyBlocked = Math.abs(fortsRisk.moneyBlocked ?? 0);
    const posRisk = Math.abs(fortsRisk.posRisk ?? 0);
    const riskBase = Math.max(moneyBlocked, posRisk);

    if (riskBase <= 0) {
      return this.toComponent(
        PortfolioRiskComponentKind.Forts,
        PortfolioRiskState.Green,
        null,
        'portfolioRiskGauge.values.noMarginRequirementLoad'
      );
    }

    if (moneyFree <= 0) {
      return this.toComponent(
        PortfolioRiskComponentKind.Forts,
        PortfolioRiskState.Critical,
        0
      );
    }

    return this.toComponent(
      PortfolioRiskComponentKind.Forts,
      this.getStateByReserveRatio(moneyFree / Math.max(riskBase, eps)),
      moneyFree / Math.max(riskBase, eps)
    );
  }

  static calculateSingle(component: PortfolioRiskComponentView): PortfolioRiskGaugeView {
    return {
      state: component.state,
      labelKey: this.getStateLabelKey(component.state),
      reserveRatio: component.reserveRatio,
      valueTextKey: component.valueTextKey,
      gaugeValuePercent: component.gaugeValuePercent,
      components: []
    };
  }

  static calculateEdp(
    nprComponent: PortfolioRiskComponentView | null,
    fortsComponent: PortfolioRiskComponentView | null
  ): PortfolioRiskGaugeView {
    if (nprComponent == null || fortsComponent == null) {
      return this.noData();
    }

    const worstComponent = [nprComponent, fortsComponent]
      .sort((a, b) => stateSeverity[b.state] - stateSeverity[a.state])[0];

    return {
      state: worstComponent.state,
      labelKey: this.getStateLabelKey(worstComponent.state),
      reserveRatio: worstComponent.reserveRatio,
      valueTextKey: worstComponent.valueTextKey,
      gaugeValuePercent: worstComponent.gaugeValuePercent,
      components: [nprComponent, fortsComponent]
    };
  }

  static noData(): PortfolioRiskGaugeView {
    return {
      state: PortfolioRiskState.NoData,
      labelKey: this.getStateLabelKey(PortfolioRiskState.NoData),
      reserveRatio: null,
      valueTextKey: 'portfolioRiskGauge.values.noData',
      gaugeValuePercent: 0,
      components: []
    };
  }

  private static getStateByReserveRatio(reserveRatio: number): PortfolioRiskState {
    if (reserveRatio < minWarningReserveRatio) {
      return PortfolioRiskState.Red;
    }

    if (reserveRatio < minHealthyReserveRatio) {
      return PortfolioRiskState.Yellow;
    }

    return PortfolioRiskState.Green;
  }

  private static toComponent(
    kind: PortfolioRiskComponentKind,
    state: PortfolioRiskState,
    reserveRatio: number | null,
    valueTextKey: string | null = null,
    gaugeValuePercent: number | null = null
  ): PortfolioRiskComponentView {
    return {
      kind,
      state,
      labelKey: this.getComponentLabelKey(kind),
      reserveRatio,
      valueTextKey,
      gaugeValuePercent: gaugeValuePercent ?? this.toGaugeValuePercent(reserveRatio)
    };
  }

  private static getSafeRatio(value: number, base: number): number | null {
    if (base <= 0) {
      return null;
    }

    return value / Math.max(base, eps);
  }

  private static toGaugeValuePercent(reserveRatio: number | null): number {
    if (reserveRatio == null) {
      return 0;
    }

    return Math.min(Math.max(100 - reserveRatio * 100, 0), 100);
  }

  private static getStateLabelKey(state: PortfolioRiskState): string {
    return `portfolioRiskGauge.states.${state}`;
  }

  private static getComponentLabelKey(kind: PortfolioRiskComponentKind): string {
    return `portfolioRiskGauge.components.${kind}`;
  }
}
