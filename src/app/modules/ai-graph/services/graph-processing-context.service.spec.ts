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
import { ClientReportsService } from 'src/app/shared/services/client-reports.service';
import { TradesHistoryService } from "../../../shared/services/trades-history.service";
import { DashboardContextService } from "../../../shared/services/dashboard-context.service";
import { UserPortfoliosService } from "../../../shared/services/user-portfolios.service";

describe('GraphProcessingContextService', () => {
  let service: GraphProcessingContextService;

  const mockNewsService = {};
  const mockLlmService = {};
  const mockPositionsService = {};
  const mockQuotesService = {};
  const mockTranslatorService = {};
  const mockHistoryService = {};
  const mockPortfolioSummaryService = {};
  const mockClientReportsService = {};
  const mockTradesHistoryService = {};
  const mockDashboardContextService = {};
  const mockUserPortfoliosService = {};

  beforeEach(() => {
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
        { provide: ClientReportsService, useValue: mockClientReportsService },
        { provide: TradesHistoryService, useValue: mockTradesHistoryService },
        { provide: DashboardContextService, useValue: mockDashboardContextService },
        { provide: UserPortfoliosService, useValue: mockUserPortfoliosService },
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(GraphProcessingContextService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
