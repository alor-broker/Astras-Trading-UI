import { TestBed } from '@angular/core/testing';

import { OrderSubmitService } from './order-submit.service';
import { PortfolioSubscriptionsService } from "../../../shared/services/portfolio-subscriptions.service";
import { of } from "rxjs";

describe('OrderSubmitService', () => {
  let service: OrderSubmitService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: PortfolioSubscriptionsService,
          useValue: {
            getAllPositionsSubscription: jasmine.createSpy('getAllPositionsSubscription').and.returnValue(of(null))
          }
        }
      ]
    });
    service = TestBed.inject(OrderSubmitService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
