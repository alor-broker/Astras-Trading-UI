import {
  provideHttpClient,
  withInterceptorsFromDi
} from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { InstrumentsService } from './instruments.service';
import { ErrorHandlerService } from '../../../shared/services/handle-error/error-handler.service';
import { CacheService } from '../../../shared/services/cache.service';
import {
  Observable,
  of
} from 'rxjs';
import { EnvironmentService } from "../../../shared/services/environment.service";
import { SubscriptionsDataFeedService } from "../../../shared/services/subscriptions-data-feed.service";

describe('InstrumentsService', () => {
  let service: InstrumentsService;
  const errorHandlerSpy = jasmine.createSpyObj('ErrorHandlerService', ['handleError']);
  const cacheServiceSpy = {
    wrap: jasmine.createSpy('wrap').and.returnValue((getKey: () => string, loadData: () => Observable<any>) => loadData())
  };

  beforeAll(() => TestBed.resetTestingModule());

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [],
    providers: [
        InstrumentsService,
        { provide: ErrorHandlerService, useValue: errorHandlerSpy },
        { provide: CacheService, useValue: cacheServiceSpy },
        {
            provide: EnvironmentService,
            useValue: {
                apiUrl: ''
            }
        },
        {
            provide: SubscriptionsDataFeedService,
            useValue: {
                subscribe: jasmine.createSpy('subscribe').and.returnValue(of({}))
            }
        },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
    ]
});
    service = TestBed.inject(InstrumentsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
