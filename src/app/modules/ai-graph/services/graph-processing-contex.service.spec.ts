import {TestBed} from '@angular/core/testing';
import {GraphProcessingContextService} from "./graph-processing-context.service";
import {MockProviders} from "ng-mocks";
import {NewsService} from "../../../shared/services/news.service";
import {LLMService} from "./llm.service";
import {PositionsService} from "../../../shared/services/positions.service";

describe('GraphProcessingContexService', () => {
  let service: GraphProcessingContextService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ...MockProviders(
          NewsService,
          LLMService,
          PositionsService
        )
      ]
    });
    service = TestBed.inject(GraphProcessingContextService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
