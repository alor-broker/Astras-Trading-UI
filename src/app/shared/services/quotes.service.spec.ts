import { TestBed } from '@angular/core/testing';
import { QuotesService } from './quotes.service';
import { WebsocketService } from './websocket.service';

describe('QuotesService', () => {
  let service: QuotesService;
  const spy = jasmine.createSpyObj('WebsocketService', ['unsubscribe', 'connect', 'subscribe', 'messages$']);

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: WebsocketService, useValue: spy },
        QuotesService
      ],
    });

    service = TestBed.inject(QuotesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
