import { TestBed } from '@angular/core/testing';

import {
  RXJS_WEBSOCKET_CTOR,
  SubscriptionsDataFeedService
} from './subscriptions-data-feed.service';
import {
  BehaviorSubject,
  take
} from 'rxjs';
import { AuthService } from './auth.service';
import { LoggerService } from './logging/logger.service';
import { EnvironmentService } from "./environment.service";

describe('SubscriptionsDataFeedService', () => {
  let service: SubscriptionsDataFeedService;

  let authServiceSpy: any;
  let loggerServiceSpy: any;
  let webSocketSubjectMock: any;
  let socketConstructorSpy: any;

  beforeEach(() => {
    loggerServiceSpy = jasmine.createSpyObj('LoggerService', ['trace', 'info', 'warn']);
    authServiceSpy = {
      accessToken$: new BehaviorSubject<string>('test_token')
    };

    webSocketSubjectMock = jasmine.createSpyObj('WebSocketSubject', ['subscribe', 'complete'], ['closed']);
    socketConstructorSpy = jasmine.createSpy('RXJS_WEBSOCKET_CTOR').and.returnValue(webSocketSubjectMock);
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: LoggerService, useValue: loggerServiceSpy },
        {
          provide: RXJS_WEBSOCKET_CTOR,
          useValue: socketConstructorSpy
        },
        {
          provide: EnvironmentService,
          useValue: {
            wsUrl: ''
          }
        }
      ]
    });

    service = TestBed.inject(SubscriptionsDataFeedService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should subscribe only once for the same key', () => {
    const requests = [
      {
        key: 'Key1',
        opcode: 'opcode'
      },
      {
        key: 'Key1',
        opcode: 'opcode'
      }
    ];

    const getCode = (request: any) => `${request.key}_${request.opcode}`;

    requests.forEach(request => {
      service.subscribe<any, any>(request, getCode)
        .pipe(take(1))
        .subscribe();
    });

    expect(webSocketSubjectMock.subscribe).toHaveBeenCalledTimes(1);
  });

  it('should subscribe to each unique key', () => {
    const requests = [
      {
        key: 'Key1',
        opcode: 'opcode'
      },
      {
        key: 'Key2',
        opcode: 'opcode'
      },
      {
        key: 'Key3',
        opcode: 'opcode_other'
      }
    ];

    const getCode = (request: any) => `${request.key}_${request.opcode}`;

    requests.forEach(request => {
      service.subscribe<any, any>(request, getCode)
        .pipe(take(1))
        .subscribe();
    });

    expect(webSocketSubjectMock.subscribe).toHaveBeenCalledTimes(requests.length);
  });
});
