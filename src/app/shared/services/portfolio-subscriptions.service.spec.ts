import { TestBed } from '@angular/core/testing';

import { PortfolioSubscriptionsService } from './portfolio-subscriptions.service';
import { SubscriptionsDataFeedService } from './subscriptions-data-feed.service';
import { Subject } from 'rxjs';
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { ErrorHandlerService } from "./handle-error/error-handler.service";
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { EnvironmentService } from "./environment.service";

describe('PortfolioSubscriptionsService', () => {
  let service: PortfolioSubscriptionsService;

  let subscriptionsDataFeedServiceSpy: any;

  beforeEach(() => {
    subscriptionsDataFeedServiceSpy = jasmine.createSpyObj('SubscriptionsDataFeedService', ['subscribe']);
    subscriptionsDataFeedServiceSpy.subscribe.and.returnValue(new Subject());
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [],
    providers: [
        {
            provide: SubscriptionsDataFeedService,
            useValue: subscriptionsDataFeedServiceSpy
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
    service = TestBed.inject(PortfolioSubscriptionsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
