import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AuthService } from './auth.service';
import { WebsocketService } from './websocket.service';

describe('WebsocketService', () => {
  let service: WebsocketService;
  const spy = jasmine.createSpyObj('AuthService', ['accessToken$']);
  spy.accessToken$ = of("");

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: spy },
        WebsocketService,
      ]
    });

    service = TestBed.inject(WebsocketService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

