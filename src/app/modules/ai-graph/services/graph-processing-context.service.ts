import {Injectable} from '@angular/core';
import {NewsService} from "../../../shared/services/news.service";
import {LLMService} from "./llm.service";
import {PositionsService} from "../../../shared/services/positions.service";
import {QuotesService} from "../../../shared/services/quotes.service";
import {TranslatorService} from "../../../shared/services/translator.service";
import {HistoryService} from "../../../shared/services/history.service";

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
    readonly historyService: HistoryService
  ) {
  }
}
