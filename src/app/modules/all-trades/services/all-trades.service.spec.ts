import { TestBed } from '@angular/core/testing';

import { AllTradesService } from './all-trades.service';
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { ErrorHandlerService } from "../../../shared/services/handle-error/error-handler.service";
import { WebsocketService } from '../../../shared/services/websocket.service';

describe('AllTradesService', () => {
  let service: AllTradesService;

  let websocketServiceSpy: any;

  beforeEach(() => {
    websocketServiceSpy = jasmine.createSpyObj('WebsocketService', ['unsubscribe', 'connect', 'subscribe', 'messages$']);
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      providers: [
        AllTradesService,
        {
          provide: ErrorHandlerService,
          useValue: {
            handleError: jasmine.createSpy('handleError').and.callThrough()
          }
        },
        {
          provide: WebsocketService,
          useValue: websocketServiceSpy
        }
      ]
    });
    service = TestBed.inject(AllTradesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
