import { TestBed } from '@angular/core/testing';
import { ExchangeRateService } from './exchange-rate.service';
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { WebsocketService } from "../../../shared/services/websocket.service";
import { of } from "rxjs";

describe('ExchangeRateService', () => {
  let service: ExchangeRateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      providers: [
        ExchangeRateService,
        {
          provide: WebsocketService,
          useValue: {
            connect: jasmine.createSpy('connect'),
            messages$: of({}),
            subscribe: jasmine.createSpy('subscribe'),
            unsubscribe: jasmine.createSpy('unsubscribe'),
          }
        }
      ]
    });
    service = TestBed.inject(ExchangeRateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
