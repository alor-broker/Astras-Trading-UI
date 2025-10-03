import { TestBed } from '@angular/core/testing';

import { UrgentNotificationsService } from './urgent-notifications.service';
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { MockProvider } from "ng-mocks";
import { ErrorHandlerService } from "../../../shared/services/handle-error/error-handler.service";
import { EnvironmentService } from "../../../shared/services/environment.service";

describe('UrgentNotificationsService', () => {
  let service: UrgentNotificationsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers:[
        provideHttpClient(),
        provideHttpClientTesting(),
        MockProvider(ErrorHandlerService),
        MockProvider(EnvironmentService)
      ]
    });
    service = TestBed.inject(UrgentNotificationsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
