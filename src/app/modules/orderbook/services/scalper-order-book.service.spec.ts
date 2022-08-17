import { TestBed } from '@angular/core/testing';

import { ScalperOrderBookService } from './scalper-order-book.service';
import { sharedModuleImportForTests } from "../../../shared/utils/testing";
import { WebsocketService } from "../../../shared/services/websocket.service";

describe('ScalperOrderBookService', () => {
  let service: ScalperOrderBookService;

  let websocketServiceSpy: any;

  beforeEach(() => {
    websocketServiceSpy = jasmine.createSpyObj(
      'WebsocketService',
      [
        'unsubscribe',
        'connect',
        'subscribe',
        'messages$'
      ]);
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        ...sharedModuleImportForTests
      ],
      providers: [
        ScalperOrderBookService,
        { provide: WebsocketService, useValue: websocketServiceSpy }
      ]
    });
    service = TestBed.inject(ScalperOrderBookService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
