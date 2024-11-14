import { TestBed } from '@angular/core/testing';

import { OrdersGroupService } from './orders-group.service';
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { ErrorHandlerService } from "../handle-error/error-handler.service";
import { EnvironmentService } from "../environment.service";
import { provideHttpClient } from '@angular/common/http';
import { EventBusService } from "../event-bus.service";
import { EMPTY } from "rxjs";

describe('OrdersGroupService', () => {
  let service: OrdersGroupService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [
        {
          provide: EnvironmentService,
          useValue: {
            apiUrl: ''
          }
        },
        {
          provide: ErrorHandlerService,
          useValue: {
            handleError: jasmine.createSpy('handleError').and.callThrough()
          }
        },
        {
          provide: EventBusService,
          useValue: {
            subscribe: jasmine.createSpy('subscribe').and.returnValue(EMPTY)
          }
        },
        provideHttpClient(),
        provideHttpClientTesting(),
      ]
    });
    service = TestBed.inject(OrdersGroupService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
