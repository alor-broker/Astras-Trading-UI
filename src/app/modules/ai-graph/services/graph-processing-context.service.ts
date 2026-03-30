import { Injectable, inject } from '@angular/core';
import { NewsService } from "../../../shared/services/news.service";
import { LLMService } from "./llm.service";
import { PositionsService } from "../../../shared/services/positions.service";
import { QuotesService } from "../../../shared/services/quotes.service";
import { TranslatorService } from "../../../shared/services/translator.service";
import { HistoryService } from "../../../shared/services/history.service";
import { PortfolioSummaryService } from 'src/app/shared/services/portfolio-summary.service';
import { ClientReportsService } from "../../../shared/services/client-reports.service";
import { TradesHistoryService } from "../../../shared/services/trades-history.service";
import { Portfolio } from "../graph/slot-types";
import {
  combineLatest,
  filter,
  Observable,
  of,
} from "rxjs";
import { DashboardContextService } from "../../../shared/services/dashboard-context.service";
import { UserPortfoliosService } from "../../../shared/services/user-portfolios.service";
import { map } from "rxjs/operators";
import { PortfolioKeyEqualityComparer } from "../../../shared/models/portfolio-key.model";

export interface ProcessingDataContext {
  currentPortfolio: Portfolio;
  currentDate: Date;
}

@Injectable({
  providedIn: 'root'
})
export class GraphProcessingContextService {
  readonly newsService = inject(NewsService);
  readonly llmService = inject(LLMService);
  readonly positionsService = inject(PositionsService);
  readonly quotesService = inject(QuotesService);
  readonly translatorService = inject(TranslatorService);
  readonly historyService = inject(HistoryService);
  readonly portfolioSummaryService = inject(PortfolioSummaryService);
  readonly clientReportsService = inject(ClientReportsService);
  readonly tradesHistoryService = inject(TradesHistoryService);
  private readonly dashboardContextService = inject(DashboardContextService);
  private readonly userPortfoliosService = inject(UserPortfoliosService);

  private dataContext$: Observable<ProcessingDataContext> | null = null;

  get dataContext(): Observable<ProcessingDataContext> {
    if (this.dataContext$ == null) {
      const currentPortfolio$ = combineLatest({
        selectedPortfolio: this.dashboardContextService.selectedPortfolio$,
        userPortfolios: this.userPortfoliosService.getPortfolios()
      }).pipe(
        map(x => {
          const portfolio = x.userPortfolios.find(p => PortfolioKeyEqualityComparer.equals(p, x.selectedPortfolio));
          if (portfolio == null) {
            return null;
          }

          return {
            portfolio: portfolio.portfolio,
            exchange: portfolio.exchange,
            agreement: portfolio.agreement,
            market: portfolio.marketType ?? null
          };
        }),
        filter(x => x != null)
      );

      this.dataContext$ = combineLatest({
        currentPortfolio: currentPortfolio$,
        currentDate: of(new Date())
      });
    }

    return this.dataContext$;
  }
}
