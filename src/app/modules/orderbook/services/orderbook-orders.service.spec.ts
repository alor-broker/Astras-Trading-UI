import { fakeAsync, TestBed, tick } from '@angular/core/testing';

import { OrderbookOrdersService } from './orderbook-orders.service';
import { instrumentsBadges } from "../../../shared/utils/instruments";

fdescribe('OrderbookOrdersService', () => {
  let service: OrderbookOrdersService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OrderbookOrdersService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should correctly provide values', fakeAsync(() => {
    const expectedValue = {price: 100, badgeColor: instrumentsBadges[0]};
    service.selectedOrderPrice.subscribe((val) => expect(val).toEqual(expectedValue));

    service.selectPrice(expectedValue.price, expectedValue.badgeColor);
    tick();
  }));

  it('should not provide values', fakeAsync(() => {
    const callbackSpy = jasmine.createSpy('callbackSpy').and.callThrough();
    service.selectedOrderPrice.subscribe();

    service.selectPrice(100, 'anyColor');
    service.selectPrice(0, instrumentsBadges[0]);
    tick();

    expect(callbackSpy).not.toHaveBeenCalled();
  }));
});
