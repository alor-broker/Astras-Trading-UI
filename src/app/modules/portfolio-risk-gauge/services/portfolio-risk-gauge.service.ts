import {
  inject,
  Injectable
} from '@angular/core';
import {Observable} from "rxjs";
import {
  map,
  startWith
} from "rxjs/operators";
import {Risks} from "../../blotter/models/risks.model";
import {PortfolioKey} from "../../../shared/models/portfolio-key.model";
import {PortfolioSubscriptionsService} from "../../../shared/services/portfolio-subscriptions.service";
import {PortfolioRiskGaugeView} from "../models/portfolio-risk-gauge.model";
import {PortfolioRiskGaugeCalculator} from "../utils/portfolio-risk-gauge-calculator";

@Injectable({
  providedIn: 'root'
})
export class PortfolioRiskGaugeService {
  private readonly portfolioSubscriptionsService = inject(PortfolioSubscriptionsService);

  getGaugeView(portfolioKey: PortfolioKey): Observable<PortfolioRiskGaugeView> {
    return this.portfolioSubscriptionsService.getRisksSubscription(portfolioKey.portfolio, portfolioKey.exchange).pipe(
      startWith(null),
      map((risk: Risks | null) => risk == null
        ? PortfolioRiskGaugeCalculator.noData()
        : PortfolioRiskGaugeCalculator.calculate(risk)
      )
    );
  }
}
