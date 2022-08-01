import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import { AuthService } from './auth.service';
import { WEBSOCKET_CTOR, WebsocketService } from './websocket.service';

let fakeSocket: Subject<any>;
const fakeSocketCtor = jasmine
  .createSpy('WEBSOCKET_CTOR')
  .and.callFake(() => fakeSocket);

describe('WebsocketService', () => {
  let service: WebsocketService;
  const spy = jasmine.createSpyObj('AuthService', ['accessToken$']);
  spy.accessToken$ = of("");

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: spy },
        {
          provide: WEBSOCKET_CTOR,
          useValue: fakeSocketCtor
        },
        WebsocketService,
      ]
    });

    fakeSocket = new Subject<any>();
    fakeSocketCtor.calls.reset();
    service = TestBed.inject(WebsocketService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should connect only once', () => {
    service.connect();
    service.connect();
    expect(fakeSocketCtor).toHaveBeenCalledOnceWith(service.config);
  });

  it('should receive messages when connected and have data', fakeAsync(() => {
    const subCallbackSpy = jasmine.createSpy('subCallbackSpy').and.callThrough();
    const sub = service.messages$.subscribe(subCallbackSpy);

    fakeSocket.next({data: 'test'});
    tick();

    expect(subCallbackSpy).not.toHaveBeenCalled();
    sub.unsubscribe();

    service.connect();
    service.messages$.subscribe(subCallbackSpy);

    fakeSocket.next({data: 'test'});
    fakeSocket.next({message: 'test message'});
    tick();

    expect(subCallbackSpy).toHaveBeenCalledOnceWith({data: 'test'});
  }));

  it('should close connection', fakeAsync(() => {
    const subCallbackSpy = jasmine.createSpy('subCallbackSpy').and.callThrough();

    service.connect();
    service.messages$.subscribe(subCallbackSpy);
    service.close();
    fakeSocket.next({data: 'test'});
    tick();

    expect(subCallbackSpy).not.toHaveBeenCalled();
  }));
});

