/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { of } from 'rxjs';
import { AuthService } from './auth.service';
import { WebsocketService } from './websocket.service';

describe('Service: Websocket', () => {
  const spy = jasmine.createSpyObj('AuthService', ['accessToken$']);
  spy.accessToken$ = of("");

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: spy },
        WebsocketService,
      ]
    });
  });

  it('should ...', inject([WebsocketService], (service: WebsocketService) => {
    expect(service).toBeTruthy();
  }));
});

