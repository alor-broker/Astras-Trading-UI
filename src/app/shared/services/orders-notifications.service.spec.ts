import { TestBed } from '@angular/core/testing';
import { OrdersNotificationsService } from './orders-notifications.service';
import { InstantNotificationsService } from './instant-notifications.service';

describe('OrdersNotificationsService', () => {
  let service: OrdersNotificationsService;
  const spy = jasmine.createSpyObj('InstantNotificationsService', ['showNotification']);

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        OrdersNotificationsService,
        { provide: InstantNotificationsService, useValue: spy }
      ]
    });

    service = TestBed.inject(OrdersNotificationsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
