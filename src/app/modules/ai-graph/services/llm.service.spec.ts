import {TestBed} from '@angular/core/testing';

import {LLMService} from './llm.service';
import {provideHttpClient} from "@angular/common/http";
import {provideHttpClientTesting} from "@angular/common/http/testing";
import {MockProvider} from "ng-mocks";
import {EnvironmentService} from "../../../shared/services/environment.service";
import {ErrorHandlerService} from "../../../shared/services/handle-error/error-handler.service";

describe('LLMService', () => {
  let service: LLMService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        MockProvider(EnvironmentService),
        MockProvider(ErrorHandlerService),
      ]
    });
    service = TestBed.inject(LLMService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
