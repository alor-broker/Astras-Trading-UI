import { TestBed } from '@angular/core/testing';

import { AllTradesService } from './all-trades.service';
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { ErrorHandlerService } from './handle-error/error-handler.service';
import { SubscriptionsDataFeedService } from './subscriptions-data-feed.service';
import {Subject} from "rxjs";
import { EnvironmentService } from "./environment.service";
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('AllTradesService', () => {
  let service: AllTradesService;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [],
    providers: [
        AllTradesService,
        {
            provide: ErrorHandlerService,
            useValue: {
                handleError: jasmine.createSpy('handleError').and.callThrough()
            }
        },
        {
            provide: SubscriptionsDataFeedService,
            useValue: {
                subscribe: jasmine.createSpy('subscribe').and.returnValue(new Subject())
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
    service = TestBed.inject(AllTradesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
