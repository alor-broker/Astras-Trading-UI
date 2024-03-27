import { TestBed } from '@angular/core/testing';
import { OrdersNotificationsService } from './orders-notifications.service';
import { InstantTranslatableNotificationsService } from "./instant-translatable-notifications.service";

describe('OrdersNotificationsService', () => {
  let service: OrdersNotificationsService;
  const spy = jasmine.createSpyObj('InstantTranslatableNotificationsService', ['showNotification']);

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        OrdersNotificationsService,
        { provide: InstantTranslatableNotificationsService, useValue: spy }
      ]
    });

    service = TestBed.inject(OrdersNotificationsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
