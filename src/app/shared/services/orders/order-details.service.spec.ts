import {TestBed} from '@angular/core/testing';

import {OrderDetailsService} from './order-details.service';
import {HttpClientTestingModule} from "@angular/common/http/testing";
import {ErrorHandlerService} from "../handle-error/error-handler.service";

describe('OrderDetailsService', () => {
  let service: OrderDetailsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: ErrorHandlerService,
          useValue: {
            handleError: jasmine.createSpy('handleError').and.callThrough()
          }
        }
      ]
    });
    service = TestBed.inject(OrderDetailsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
