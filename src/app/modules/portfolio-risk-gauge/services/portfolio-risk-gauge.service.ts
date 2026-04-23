import { Injectable, inject } from '@angular/core';
import {
  Observable,
  combineLatest,
  of
} from "rxjs";
import {
  catchError,
  map,
  startWith
} from "rxjs/operators";
import { ForwardRisks } from "../../blotter/models/forward-risks.model";
import { Risks } from "../../blotter/models/risks.model";
import {
  MarketType,
  PortfolioKey
} from "../../../shared/models/portfolio-key.model";
import { PortfolioSubscriptionsService } from "../../../shared/services/portfolio-subscriptions.service";
import { getMarketTypeByPortfolio } from "../../../shared/utils/portfolios";
import {
  PortfolioRiskComponentView,
  PortfolioRiskGaugeView
} from "../models/portfolio-risk-gauge.model";
import { PortfolioRiskGaugeCalculator } from "../utils/portfolio-risk-gauge-calculator";

@Injectable({
  providedIn: 'root'
})
export class PortfolioRiskGaugeService {
  private readonly portfolioSubscriptionsService = inject(PortfolioSubscriptionsService);

  getGaugeView(portfolioKey: PortfolioKey): Observable<PortfolioRiskGaugeView> {
    const marketType = portfolioKey.marketType ?? getMarketTypeByPortfolio(portfolioKey.portfolio);

    if (marketType === MarketType.Forward) {
      return this.getFortsComponent(portfolioKey).pipe(
        map(component => component == null
          ? PortfolioRiskGaugeCalculator.noData()
          : PortfolioRiskGaugeCalculator.calculateSingle(component)
        )
      );
    }

    if (marketType === MarketType.United) {
      return combineLatest({
        nprComponent: this.getNprComponent(portfolioKey),
        fortsComponent: this.getFortsComponent(portfolioKey)
      }).pipe(
        map(({ nprComponent, fortsComponent }) => PortfolioRiskGaugeCalculator.calculateEdp(
          nprComponent,
          fortsComponent
        ))
      );
    }

    return this.getNprComponent(portfolioKey).pipe(
      map(component => component == null
        ? PortfolioRiskGaugeCalculator.noData()
        : PortfolioRiskGaugeCalculator.calculateSingle(component)
      )
    );
  }

  private getNprComponent(portfolioKey: PortfolioKey): Observable<PortfolioRiskComponentView | null> {
    return this.portfolioSubscriptionsService.getRisksSubscription(portfolioKey.portfolio, portfolioKey.exchange).pipe(
      catchError(() => of(null)),
      startWith(null),
      map((risk: Risks | null) => risk == null
        ? null
        : PortfolioRiskGaugeCalculator.calculateNpr(risk)
      )
    );
  }

  private getFortsComponent(portfolioKey: PortfolioKey): Observable<PortfolioRiskComponentView | null> {
    return this.portfolioSubscriptionsService.getSpectraRisksSubscription(portfolioKey.portfolio, portfolioKey.exchange).pipe(
      catchError(() => of(null)),
      startWith(null),
      map((fortsRisk: ForwardRisks | null) => fortsRisk == null
        ? null
        : PortfolioRiskGaugeCalculator.calculateForts(fortsRisk)
      )
    );
  }
}
