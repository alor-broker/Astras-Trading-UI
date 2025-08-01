import { TestBed } from '@angular/core/testing';

import { ClientReportsService } from './client-reports.service';
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { MockProvider } from "ng-mocks";
import { EnvironmentService } from "./environment.service";
import {commonTestProviders} from "../utils/testing/common-test-providers";
import { ErrorHandlerService } from "./handle-error/error-handler.service";

describe('ClientReportsService', () => {
  let service: ClientReportsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ...commonTestProviders,
        provideHttpClient(),
        provideHttpClientTesting(),
        MockProvider(EnvironmentService),
        MockProvider(ErrorHandlerService)
      ]
    });
    service = TestBed.inject(ClientReportsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
