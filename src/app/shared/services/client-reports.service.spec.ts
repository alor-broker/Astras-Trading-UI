import { TestBed } from '@angular/core/testing';

import { ClientReportsService } from './client-reports.service';
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { MockProvider } from "ng-mocks";
import { EnvironmentService } from "./environment.service";
import { HttpErrorHandler } from "./handle-error/http-error-handler";

describe('ClientReportsService', () => {
  let service: ClientReportsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        MockProvider(EnvironmentService),
        MockProvider(HttpErrorHandler)
      ]
    });
    service = TestBed.inject(ClientReportsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
