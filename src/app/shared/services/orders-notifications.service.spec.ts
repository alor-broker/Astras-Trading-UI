import { TestBed } from '@angular/core/testing';
import { OrdersNotificationsService } from './orders-notifications.service';
import {
  OrderInstantTranslatableNotificationsService
} from "./orders/order-instant-translatable-notifications.service";

describe('OrdersNotificationsService', () => {
  let service: OrdersNotificationsService;
  const spy = jasmine.createSpyObj('OrderInstantTranslatableNotificationsService', [
    'orderFilled',
    'orderStatusChangeToCancelled',
    'orderStatusChanged',
    'orderPartiallyFilled'
  ]);

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        OrdersNotificationsService,
        { provide: OrderInstantTranslatableNotificationsService, useValue: spy }
      ]
    });

    service = TestBed.inject(OrdersNotificationsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
