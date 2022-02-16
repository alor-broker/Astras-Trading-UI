/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { QuotesService } from './quotes.service';
import { WebsocketService } from './websocket.service';

describe('Service: Quotes', () => {
  const spy = jasmine.createSpyObj('WebsocketService', ['unsubscribe', 'connect', 'subscribe', 'messages$']);
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: WebsocketService, useValue: spy },
        QuotesService
      ],
    });
  });

  it('should ...', inject([QuotesService], (service: QuotesService) => {
    expect(service).toBeTruthy();
  }));
});
