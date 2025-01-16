import { TestBed } from '@angular/core/testing';

import { PushNotificationsService } from './push-notifications.service';
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { ErrorHandlerService } from "../../../shared/services/handle-error/error-handler.service";
import { EnvironmentService } from "../../../shared/services/environment.service";
import { TranslatorService } from "../../../shared/services/translator.service";
import {
  provideHttpClient,
  withInterceptorsFromDi
} from '@angular/common/http';
import { MockProvider } from "ng-mocks";
import { LoggerService } from "../../../shared/services/logging/logger.service";

describe('FirebaseNotificationsService', () => {
  let service: PushNotificationsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [
        MockProvider(
          EnvironmentService,
          {
            apiUrl: ''
          }
        ),
        MockProvider(ErrorHandlerService),
        MockProvider(
          TranslatorService,
          {
            getActiveLang: jasmine.createSpy('getActiveLang').and.returnValue('ru')
          }
        ),
        MockProvider(LoggerService),
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(PushNotificationsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
