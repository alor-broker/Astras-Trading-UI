/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { OrderbookService } from './orderbook.service';

describe('Service: Orderbook', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [OrderbookService]
    });
  });

  it('should ...', inject([OrderbookService], (service: OrderbookService) => {
    expect(service).toBeTruthy();
  }));
});
