import { TestBed } from '@angular/core/testing';

import { AdminClientsService } from './admin-clients.service';
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { MockProvider } from "ng-mocks";
import { ErrorHandlerService } from "../../../../shared/services/handle-error/error-handler.service";
import { EnvironmentService } from "../../../../shared/services/environment.service";

describe('AdminClientsService', () => {
  let service: AdminClientsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        MockProvider(ErrorHandlerService),
        MockProvider(EnvironmentService),
      ],
    });
    service = TestBed.inject(AdminClientsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
