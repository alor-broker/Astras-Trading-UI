import { TestBed } from '@angular/core/testing';

import { TradeClustersService } from './trade-clusters.service';
import { ErrorHandlerService } from '../../../shared/services/handle-error/error-handler.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import {SubscriptionsDataFeedService} from "../../../shared/services/subscriptions-data-feed.service";
import {Subject} from "rxjs";

describe('TradeClustersService', () => {
  let service: TradeClustersService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
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
        }
      ]
    });

    service = TestBed.inject(TradeClustersService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
