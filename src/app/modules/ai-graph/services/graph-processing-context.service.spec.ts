import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { GraphProcessingContextService } from './graph-processing-context.service';
import { NewsService } from '../../../shared/services/news.service';
import { LLMService } from './llm.service';
import { PositionsService } from '../../../shared/services/positions.service';
import { QuotesService } from '../../../shared/services/quotes.service';
import { TranslatorService } from '../../../shared/services/translator.service';
import { HistoryService } from '../../../shared/services/history.service';
import { PortfolioSummaryService } from 'src/app/shared/services/portfolio-summary.service';
import { of } from 'rxjs';

describe('GraphProcessingContextService', () => {
  let service: GraphProcessingContextService;

  const mockNewsService = jasmine.createSpyObj('NewsService', ['getNews']);
  const mockLlmService = jasmine.createSpyObj('LLMService', ['requestCompletion']);
  const mockPositionsService = jasmine.createSpyObj('PositionsService', ['getAllByPortfolio']);
  const mockQuotesService = jasmine.createSpyObj('QuotesService', ['getQuotes', 'getLastPrice']);
  const mockTranslatorService = jasmine.createSpyObj('TranslatorService', ['getTranslator']);
  const mockHistoryService = jasmine.createSpyObj('HistoryService', ['getHistory']);
  const mockPortfolioSummaryService = jasmine.createSpyObj('PortfolioSummaryService', ['getCommonSummary']);

  beforeEach(() => {
    mockNewsService.getNews.and.returnValue(of([]));
    mockLlmService.requestCompletion.and.returnValue(of(''));
    mockPositionsService.getAllByPortfolio.and.returnValue(of([]));
    mockQuotesService.getQuotes.and.returnValue(of({}));
    mockQuotesService.getLastPrice.and.returnValue(of(0));
    mockTranslatorService.getTranslator.and.returnValue(of(() => ''));
    mockHistoryService.getHistory.and.returnValue(of([]));
    mockPortfolioSummaryService.getCommonSummary.and.returnValue(of({}));

    TestBed.configureTestingModule({
      providers: [
        GraphProcessingContextService,
        { provide: NewsService, useValue: mockNewsService },
        { provide: LLMService, useValue: mockLlmService },
        { provide: PositionsService, useValue: mockPositionsService },
        { provide: QuotesService, useValue: mockQuotesService },
        { provide: TranslatorService, useValue: mockTranslatorService },
        { provide: HistoryService, useValue: mockHistoryService },
        { provide: PortfolioSummaryService, useValue: mockPortfolioSummaryService },
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(GraphProcessingContextService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
