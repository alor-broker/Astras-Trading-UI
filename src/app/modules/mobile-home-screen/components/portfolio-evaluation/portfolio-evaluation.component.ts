import { Component, output, inject } from '@angular/core';
import { TranslocoDirective } from "@jsverse/transloco";
import { PortfolioSummaryService } from "../../../../shared/services/portfolio-summary.service";
import { DashboardContextService } from "../../../../shared/services/dashboard-context.service";
import {
  map,
  switchMap
} from "rxjs/operators";
import {
  AsyncPipe,
  NgClass
} from "@angular/common";
import {
  combineLatest,
  of
} from 'rxjs';
import { MarketType } from "../../../../shared/models/portfolio-key.model";
import { NzIconDirective } from "ng-zorro-antd/icon";

@Component({
  selector: 'ats-portfolio-evaluation',
  imports: [
    TranslocoDirective,
    AsyncPipe,
    NgClass,
    NzIconDirective
  ],
  templateUrl: './portfolio-evaluation.component.html',
  styleUrl: './portfolio-evaluation.component.less'
})
export class PortfolioEvaluationComponent {
  private readonly dashboardContextService = inject(DashboardContextService);
  private readonly portfolioSummaryService = inject(PortfolioSummaryService);

  readonly openDetails = output();

  readonly summary$ = this.dashboardContextService.selectedPortfolio$.pipe(
    switchMap(portfolio => {
      if(portfolio.marketType !== MarketType.Forward) {
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
      if(x.forwardSummary == null) {
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
