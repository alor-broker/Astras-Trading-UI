import { Injectable } from '@angular/core';
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
  private dataContext$: Observable<ProcessingDataContext> | null = null;

  constructor(
    readonly newsService: NewsService,
    readonly llmService: LLMService,
    readonly positionsService: PositionsService,
    readonly quotesService: QuotesService,
    readonly translatorService: TranslatorService,
    readonly historyService: HistoryService,
    readonly portfolioSummaryService: PortfolioSummaryService,
    readonly clientReportsService: ClientReportsService,
    readonly tradesHistoryService: TradesHistoryService,
    // Internal services. Use only to fill context
    private readonly dashboardContextService: DashboardContextService,
    private readonly userPortfoliosService: UserPortfoliosService
  ) {
  }

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
