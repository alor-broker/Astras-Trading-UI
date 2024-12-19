import { TestBed } from '@angular/core/testing';

import { RisksService } from './risks.service';
import { MockProvider } from "ng-mocks";
import { EnvironmentService } from "../../../shared/services/environment.service";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { ErrorHandlerService } from "../../../shared/services/handle-error/error-handler.service";

describe('RisksService', () => {
  let service: RisksService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MockProvider(EnvironmentService),
        MockProvider(ErrorHandlerService),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(RisksService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
