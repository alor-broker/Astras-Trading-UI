import {Injectable} from '@angular/core';
import {NewsService} from "../../../shared/services/news.service";
import {LLMService} from "./llm.service";
import {PositionsService} from "../../../shared/services/positions.service";
import {QuotesService} from "../../../shared/services/quotes.service";
import {TranslatorService} from "../../../shared/services/translator.service";
import {HistoryService} from "../../../shared/services/history.service";
import {PortfolioSummaryService} from 'src/app/shared/services/portfolio-summary.service';
import {ClientReportsService} from "../../../shared/services/client-reports.service";
import { TradesHistoryService } from "../../../shared/services/trades-history.service";

@Injectable({
  providedIn: 'root'
})
export class GraphProcessingContextService {
  constructor(
    readonly newsService: NewsService,
    readonly llmService: LLMService,
    readonly positionsService: PositionsService,
    readonly quotesService: QuotesService,
    readonly translatorService: TranslatorService,
    readonly historyService: HistoryService,
    readonly portfolioSummaryService: PortfolioSummaryService,
    readonly clientReportsService: ClientReportsService,
    readonly tradesHistoryService: TradesHistoryService
  ) {
  }
}
