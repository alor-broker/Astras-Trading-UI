import { TestBed } from '@angular/core/testing';
import { BaseWebsocketService } from './base-websocket.service';
import { WebsocketService } from './websocket.service';
import { Injectable } from "@angular/core";

@Injectable()
class BaseWebsocketServiceTest extends BaseWebsocketService {
  constructor(ws: WebsocketService) {
    super(ws);
  }
}

describe('BaseWebsocketService', () => {
  let service: BaseWebsocketServiceTest;
  const wsSpy = jasmine.createSpyObj('WebsocketService', ['connect']);

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
});
