import { TestBed } from '@angular/core/testing';
import { WebsocketService } from 'src/app/shared/services/websocket.service';

import { BlotterService } from './blotter.service';

describe('OrderService', () => {
  let service: BlotterService;
  const spy = jasmine.createSpyObj('WebsocketService', ['unsubscribe', 'connect', 'subscribe', 'messages$']);

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: WebsocketService, useValue: spy }
      ]
    });
    service = TestBed.inject(BlotterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
