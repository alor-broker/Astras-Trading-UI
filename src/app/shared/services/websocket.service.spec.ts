/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { Observable, of } from 'rxjs';
import { AuthService } from './auth.service';
import { WebsocketService } from './websocket.service';
import { LoggerService } from "./logger.service";

describe('Service: Websocket', () => {
  const spy = jasmine.createSpyObj('AuthService', ['accessToken$'])
  spy.accessToken$ = of("");
  const loggerSpy = jasmine.createSpyObj('LoggerService', ['error']);

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: spy },
        { provide: LoggerService, useValue: loggerSpy },
        WebsocketService,
      ]
    });
  });

  it('should ...', inject([WebsocketService], (service: WebsocketService) => {
    expect(service).toBeTruthy();
  }));
});

