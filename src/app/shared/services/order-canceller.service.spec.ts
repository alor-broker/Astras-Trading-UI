import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { OrderCancellerService } from './order-canceller.service';
import { InstantNotificationsService } from './instant-notifications.service';
import {ErrorHandlerService} from "./handle-error/error-handler.service";
import { EnvironmentService } from "./environment.service";

describe('OrderCancellerService', () => {
  let service: OrderCancellerService;
  let http: HttpClient;


  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: InstantNotificationsService,
          useValue: {
            showNotification: jasmine.createSpy('showNotification').and.callThrough()
          }
        },
        {
          provide: ErrorHandlerService,
          useValue: {
            handleError: jasmine.createSpy('handleError').and.callThrough()
          }
        },
        {
          provide: EnvironmentService,
          useValue: {
            apiUrl: ''
          }
        },
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
