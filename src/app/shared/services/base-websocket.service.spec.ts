import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { BaseWebsocketService } from './base-websocket.service';
import { WebsocketService } from './websocket.service';
import { Injectable } from "@angular/core";
import { Observable, Subject } from "rxjs";
import { BaseRequest } from "../models/ws/base-request.model";

@Injectable()
class BaseWebsocketServiceTest extends BaseWebsocketService {
  constructor(ws: WebsocketService) {
    super(ws);
  }

  getEntity(req: BaseRequest): Observable<any> {
    return super.getEntity(req);
  }

  getPortfolioEntity(portfolio: string, exchange: string, opcode: string, trackId: string): Observable<any> {
    return super.getPortfolioEntity(portfolio, exchange, opcode, trackId);
  }
}

describe('BaseWebsocketService', () => {
  let service: BaseWebsocketServiceTest;
  const wsSpy = jasmine.createSpyObj('WebsocketService', {
    unsubscribe: jasmine.createSpy('unsubscribe').and.callThrough(),
    connect: jasmine.createSpy('connect').and.callThrough(),
    subscribe: jasmine.createSpy('subscribe').and.callThrough(),
  }, {
    messages$: new Subject()
  });

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: WebsocketService, useValue: wsSpy },
        BaseWebsocketServiceTest,
      ]
    });

    service = TestBed.inject(BaseWebsocketServiceTest);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should subscribe to entity', fakeAsync(() => {
    const req = {
      opcode: 'testOpcode',
      guid: 'testGuid',
      format: 'testFormat',
      exchange: 'testExchange',
    };

    service.getEntity(req)
      .subscribe(data => {
        expect(data).toBe('testData');
      });
    tick();

    expect(wsSpy.connect).toHaveBeenCalled();
    expect(wsSpy.subscribe).toHaveBeenCalledWith(req);

    wsSpy.messages$.next({guid: 'testGuid', data: 'testData'});
    wsSpy.messages$.next({guid: 'notTestGuid', data: 'notTestData'});
    tick();
  }));

  it('should unsubscribe if resubscribe', fakeAsync(() => {
    const req = {
      opcode: 'testOpcode',
      guid: 'testGuid',
      format: 'simple',
      exchange: 'testExchange',
    };

    service.getEntity(req).subscribe();
    service.getEntity(req).subscribe();

    expect(wsSpy.unsubscribe).toHaveBeenCalled();
  }));

  it('should subscribe to portfolio entity', fakeAsync(() => {
    const req = {
      opcode: 'testOpcode',
      guid: 'testGuid',
      format: 'simple',
      exchange: 'testExchange',
      portfolio: 'testPortfolio'
    };
    const getEntitySpy = spyOn(service, 'getEntity').and.callThrough();

    service.getPortfolioEntity(req.portfolio, req.exchange, req.opcode, 'testTrackId')
      .subscribe(data => {
        expect(data).toBe('testData');
      });
    tick();

    expect(wsSpy.connect).toHaveBeenCalled();
    expect(wsSpy.subscribe).toHaveBeenCalledWith({
      ...req,
      guid: 'testTrackId:' + req.portfolio + req.exchange + req.opcode
    });
    expect(getEntitySpy).toHaveBeenCalledWith({
      ...req,
      guid: 'testTrackId:' + req.portfolio + req.exchange + req.opcode
    });

    wsSpy.messages$.next({guid: 'testGuid', data: 'testData'});
    tick();
  }));

  it('should unsubscribe all guids', () => {
    const req = {
      opcode: 'testOpcode',
      guid: 'testGuid1',
      format: 'simple',
      exchange: 'testExchange',
    };

    service.getEntity(req).subscribe();

    req.guid = 'testGuid2';
    service.getEntity(req).subscribe();

    service.unsubscribe();

    expect(wsSpy.unsubscribe).toHaveBeenCalledWith('testGuid1');
    expect(wsSpy.unsubscribe).toHaveBeenCalledWith('testGuid2');
  });

  it('should filter messages', fakeAsync(() => {
    const subCallbackSpy = jasmine.createSpy('subCallBack').and.callThrough();

    service.getEntity({
      opcode: 'testOpcode',
      guid: 'testGuid1',
      format: 'simple',
      exchange: 'testExchange',
    }).subscribe(subCallbackSpy);

    service.getEntity({
      opcode: 'testOpcode',
      guid: 'testGuid2',
      format: 'simple',
      exchange: 'testExchange',
    }).subscribe(subCallbackSpy);

    wsSpy.messages$.next({guid: 'testGuid1', data: 'test'});
    wsSpy.messages$.next({guid: 'testGuid2', data: 'test'});
    wsSpy.messages$.next({guid: 'testGuid3', data: 'test'});
    tick();

    expect(subCallbackSpy).toHaveBeenCalledTimes(2);
  }));
});
