import {
  inject,
  Injectable
} from '@angular/core';
import {Observable} from "rxjs";
import {
  map,
  startWith
} from "rxjs/operators";
import {PortfolioRiskGaugeCalculator} from "../utils/portfolio-risk-gauge-calculator";
import {PortfolioSubscriptionsService} from '@terminal-core-lib/features/portfolios/services/portfolio-subscriptions';
import {PortfolioKey} from '@terminal-core-lib/common/types/portfolio.types';
import {PortfolioRiskGaugeView} from '@terminal-widgets-lib/widgets/portfolio-risk-gauge/types/portfolio-risk-gauge.types';
import {Risks} from '@terminal-core-lib/features/portfolios/types/portfolio-summary.types';

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
