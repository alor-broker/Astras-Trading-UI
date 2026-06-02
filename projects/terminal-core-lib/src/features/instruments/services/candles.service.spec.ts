import {TestBed} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import {
  firstValueFrom,
  of
} from 'rxjs';
import {CandlesService} from './candles.service';
import {SubscriptionsDataFeedService} from '@terminal-core-lib/features/data-subscriptions/services/subscriptions-data-feed.service';
import {CORE_API_URL_PROVIDER} from '../../../config/api-url-providers';
import {ErrorHandlerService} from '../../errors-handler/error-handler.service';
import {InstrumentFixtures} from '@testing-lib/fixtures/instrument';
import {Candle} from './candles-service.types';

describe('CandlesService', () => {
  const apiUrl = 'https://api.test';
  const historyUrl = `${apiUrl}/md/v2/history`;

  let service: CandlesService;
  let httpMock: HttpTestingController;
  let subscribe: ReturnType<typeof vi.fn>;

  function createCandle(close: number): Candle {
    return {open: close, close, high: close, low: close, time: close, volume: 0} as unknown as Candle;
  }

  beforeEach(() => {
    subscribe = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        CandlesService,
        {provide: SubscriptionsDataFeedService, useValue: {subscribe}},
        {provide: CORE_API_URL_PROVIDER, useValue: {apiUrl}},
        {provide: ErrorHandlerService, useValue: {handleError: vi.fn()}},
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(CandlesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getCandleSubscription', () => {
    it('should build the request and subscription key from the instrument and timeframe', async () => {
      const candle = createCandle(100);
      subscribe.mockReturnValue(of(candle));
      const from = 1_700_000_000;

      const result = await firstValueFrom(
        service.getCandleSubscription(InstrumentFixtures.createInstrumentKey(), 'D', from)
      );

      expect(result).toEqual(candle);

      const [request, getKey] = subscribe.mock.calls[0];
      expect(request).toEqual({
        opcode: 'BarsGetAndSubscribe',
        code: 'SBER',
        exchange: 'MOEX',
        instrumentGroup: undefined,
        format: 'simple',
        tf: 'D',
        from
      });
      expect(getKey()).toBe(`getInstrumentLastCandle_MOEX_SBER_undefined_D_${from}_simple`);
    });
  });

  describe('getLastTwoDailyCandles', () => {
    it('should return the last two candles as prev/cur', () => {
      const c1 = createCandle(1);
      const c2 = createCandle(2);
      const c3 = createCandle(3);
      let result: {cur: Candle, prev: Candle} | null | undefined;

      service.getLastTwoDailyCandles(InstrumentFixtures.createInstrumentKey()).subscribe(r => result = r);
      httpMock.expectOne(req => req.url === historyUrl).flush({history: [c1, c2, c3]});

      expect(result).toEqual({prev: c2, cur: c3});
    });

    it('should return null when there are fewer than two candles', () => {
      let result: {cur: Candle, prev: Candle} | null | undefined;

      service.getLastTwoDailyCandles(InstrumentFixtures.createInstrumentKey()).subscribe(r => result = r);
      httpMock.expectOne(req => req.url === historyUrl).flush({history: [createCandle(1)]});

      expect(result).toBeNull();
    });

    it('should return null on an http error', () => {
      let result: {cur: Candle, prev: Candle} | null | undefined;

      service.getLastTwoDailyCandles(InstrumentFixtures.createInstrumentKey()).subscribe(r => result = r);
      httpMock.expectOne(req => req.url === historyUrl).flush('failure', {status: 500, statusText: 'Server Error'});

      expect(result).toBeNull();
    });
  });
});
