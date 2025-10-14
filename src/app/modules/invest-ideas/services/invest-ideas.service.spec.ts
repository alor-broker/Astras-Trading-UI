import { TestBed } from '@angular/core/testing';

import { InvestIdeasService } from './invest-ideas.service';
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { MockProvider } from "ng-mocks";
import { ErrorHandlerService } from "../../../shared/services/handle-error/error-handler.service";
import { EnvironmentService } from "../../../shared/services/environment.service";

describe('InvestIdeasService', () => {
  let service: InvestIdeasService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        InvestIdeasService,
        provideHttpClient(),
        provideHttpClientTesting(),
        MockProvider(ErrorHandlerService),
        MockProvider(EnvironmentService)
      ]
    });
    service = TestBed.inject(InvestIdeasService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
