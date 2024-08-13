import { TestBed } from '@angular/core/testing';
import { QuotesService } from './quotes.service';
import { SubscriptionsDataFeedService } from './subscriptions-data-feed.service';
import { ErrorHandlerService } from './handle-error/error-handler.service';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import {Subject} from "rxjs";
import { EnvironmentService } from "./environment.service";
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('QuotesService', () => {
  let service: QuotesService;

  beforeAll(() => TestBed.resetTestingModule());

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [],
    providers: [
        {
            provide: SubscriptionsDataFeedService,
            useValue: {
                subscribe: jasmine.createSpy('subscribe').and.returnValue(new Subject())
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
        QuotesService,
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
    ]
});

    service = TestBed.inject(QuotesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
