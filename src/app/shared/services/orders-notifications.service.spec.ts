/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { OrdersNotificationsService } from './orders-notifications.service';

describe('OrdersNotificationsService', () => {

  const spy = jasmine.createSpyObj('NzNotificationService', ['info']);

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        OrdersNotificationsService,
        { provide: NzNotificationService, useValue: spy }
      ]
    });
  });

  it('should ...', inject([OrdersNotificationsService], (service: OrdersNotificationsService) => {
    expect(service).toBeTruthy();
  }));
});
