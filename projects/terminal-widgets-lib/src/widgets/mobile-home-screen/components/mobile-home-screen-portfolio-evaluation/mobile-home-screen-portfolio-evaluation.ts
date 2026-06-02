import {
  ChangeDetectionStrategy,
  Component,
  inject,
  output,
  ViewEncapsulation
} from '@angular/core';
import {TranslocoDirective} from "@jsverse/transloco";
import {
  map,
  switchMap
} from "rxjs/operators";
import {AsyncPipe} from "@angular/common";
import {
  combineLatest,
  of
} from 'rxjs';
import {NzIconDirective} from "ng-zorro-antd/icon";
import {DASHBOARD_CONTEXT_SERVICE} from '@terminal-core-lib/features/dashboard/services/dashboard-context-service.types';
import {PortfolioSummaryService} from '@terminal-core-lib/features/portfolios/services/portfolio-summary.service';
import {MarketType} from '@terminal-core-lib/common/types/portfolio.types';

@Component({
  selector: 'ats-mobile-home-screen-portfolio-evaluation',
  imports: [
    TranslocoDirective,
    AsyncPipe,
    NzIconDirective
  ],
  templateUrl: './mobile-home-screen-portfolio-evaluation.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class MobileHomeScreenPortfolioEvaluation {
  readonly openDetails = output();

  private readonly dashboardContextService = inject(DASHBOARD_CONTEXT_SERVICE);

  private readonly portfolioSummaryService = inject(PortfolioSummaryService);

  readonly summary$ = this.dashboardContextService.selectedPortfolio$.pipe(
    switchMap(portfolio => {
      if (portfolio.marketType !== MarketType.Forward) {
        return combineLatest({
          commonSummary: this.portfolioSummaryService.getCommonSummary(portfolio),
          forwardSummary: of(null)
        });
      }

      return combineLatest({
        commonSummary: this.portfolioSummaryService.getCommonSummary(portfolio),
        forwardSummary: this.portfolioSummaryService.getForwardRisks(portfolio)
      });
    }),
    map(x => {
      if (x.forwardSummary == null) {
        return {
          portfolioLiquidation: x.commonSummary.portfolioLiquidationValue,
          dailyProfit: x.commonSummary.profit,
          dailyProfitPercent: x.commonSummary.profitRate
        };
      }

      return {
        portfolioLiquidation: x.forwardSummary.portfolioEvaluation,
        dailyProfit: x.commonSummary.profit,
        dailyProfitPercent: x.commonSummary.profitRate
      };
    })
  );
}
