/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { OrdersNotificationsService } from './orders-notifications.service';

describe('Service: OrdersNotifications', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [OrdersNotificationsService]
    });
  });

  it('should ...', inject([OrdersNotificationsService], (service: OrdersNotificationsService) => {
    expect(service).toBeTruthy();
  }));
});
