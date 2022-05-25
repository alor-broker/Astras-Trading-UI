import { TestBed } from '@angular/core/testing';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { OrdersNotificationsService } from './orders-notifications.service';

describe('OrdersNotificationsService', () => {
  let service: OrdersNotificationsService;
  const spy = jasmine.createSpyObj('NzNotificationService', ['info']);

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        OrdersNotificationsService,
        { provide: NzNotificationService, useValue: spy }
      ]
    });

    service = TestBed.inject(OrdersNotificationsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
