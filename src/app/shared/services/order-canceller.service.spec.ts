import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { NzNotificationService } from 'ng-zorro-antd/notification';

import { OrderCancellerService } from './order-canceller.service';

describe('OrderCancellerService', () => {
  let service: OrderCancellerService;
  let http: HttpClient;

  const notificationSpy = jasmine.createSpyObj('NzNotificationService', ['success', 'error', 'blank']);

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        { provide: NzNotificationService, useValue: notificationSpy },
        OrderCancellerService
      ]
    });

    http = TestBed.inject(HttpClient);
    service = TestBed.inject(OrderCancellerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
