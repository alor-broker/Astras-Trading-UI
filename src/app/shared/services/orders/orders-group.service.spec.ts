import { TestBed } from '@angular/core/testing';

import { OrdersGroupService } from './orders-group.service';
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { ErrorHandlerService } from "../handle-error/error-handler.service";
import { OrderCancellerService } from "../order-canceller.service";
import { of } from "rxjs";
import { InstantNotificationsService } from "../instant-notifications.service";
import { EnvironmentService } from "../environment.service";
import { TranslatorService } from "../translator.service";

describe('OrdersGroupService', () => {
  let service: OrdersGroupService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ HttpClientTestingModule ],
      providers: [
        {
          provide: ErrorHandlerService,
          useValue: {}
        },
        {
          provide: OrderCancellerService,
          useValue: {
            cancelOrder: jasmine.createSpy('cancelOrder').and.returnValue(of({}))
          }
        },
        {
          provide: InstantNotificationsService,
          useValue: {
            showNotification: jasmine.createSpy('showNotification').and.callThrough()
          }
        },
        {
          provide: EnvironmentService,
          useValue: {
            apiUrl: ''
          }
        },
        {
          provide: TranslatorService,
          useValue: {
            getTranslator: jasmine.createSpy('getTranslator').and.returnValue(of(() => ''))
          }
        }
      ]
    });
    service = TestBed.inject(OrdersGroupService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
