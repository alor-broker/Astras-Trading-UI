import { TestBed } from '@angular/core/testing';

import { TradesHistoryService } from './trades-history.service';
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { ErrorHandlerService } from "./handle-error/error-handler.service";
import { EnvironmentService } from "./environment.service";
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('TradesHistoryService', () => {
  let service: TradesHistoryService;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [],
    providers: [
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
    service = TestBed.inject(TradesHistoryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
