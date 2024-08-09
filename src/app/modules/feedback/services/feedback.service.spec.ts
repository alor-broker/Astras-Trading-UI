import { TestBed } from '@angular/core/testing';

import { FeedbackService } from './feedback.service';
import { LocalStorageService } from '../../../shared/services/local-storage.service';
import { ErrorHandlerService } from '../../../shared/services/handle-error/error-handler.service';
import {
  provideHttpClient,
  withInterceptorsFromDi
} from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { EnvironmentService } from "../../../shared/services/environment.service";

describe('FeedbackService', () => {
  let service: FeedbackService;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [],
    providers: [
        {
            provide: LocalStorageService,
            useValue: {
                getItem: jasmine.createSpy('getItem').and.returnValue(undefined),
                setItem: jasmine.createSpy('setItem').and.callThrough(),
            }
        },
        {
            provide: ErrorHandlerService,
            useValue: {
                handleError: jasmine.createSpy('handleError').and.callThrough()
            }
        },
        {
            provide: EnvironmentService,
            useValue: {
                apiUrl: ''
            }
        },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
    ]
});

    service = TestBed.inject(FeedbackService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
