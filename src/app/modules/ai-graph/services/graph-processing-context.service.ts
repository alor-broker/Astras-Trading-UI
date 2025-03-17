import {Injectable} from '@angular/core';
import {NewsService} from "../../../shared/services/news.service";
import {LLMService} from "./llm.service";
import {PositionsService} from "../../../shared/services/positions.service";

@Injectable({
  providedIn: 'root'
})
export class GraphProcessingContextService {
  constructor(
    readonly newsService: NewsService,
    readonly llmService: LLMService,
    readonly positionsService: PositionsService
  ) {
  }
}
