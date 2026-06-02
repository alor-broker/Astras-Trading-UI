import {TestBed} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import {
  firstValueFrom,
  of,
  toArray
} from 'rxjs';
import {QuotesService} from './quotes.service';
import {SubscriptionsDataFeedService} from '@terminal-core-lib/features/data-subscriptions/services/subscriptions-data-feed.service';
import {CORE_API_URL_PROVIDER} from '../../../config/api-url-providers';
import {ErrorHandlerService} from '../../errors-handler/error-handler.service';
import {Quote} from './quotes-service.types';

describe('QuotesService', () => {
  const apiUrl = 'https://api.test';

  let service: QuotesService;
  let httpMock: HttpTestingController;
  let subscribe: ReturnType<typeof vi.fn>;

  function createQuote(overrides: Partial<Quote>): Quote {
    return {symbol: 'SBER', exchange: 'MOEX', last_price: 100, ...overrides} as unknown as Quote;
  }

  beforeEach(() => {
    subscribe = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        QuotesService,
        {provide: SubscriptionsDataFeedService, useValue: {subscribe}},
        {provide: CORE_API_URL_PROVIDER, useValue: {apiUrl}},
        {provide: ErrorHandlerService, useValue: {handleError: vi.fn()}},
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(QuotesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getQuotesSubscription', () => {
    it('should build the request, generate the subscription key and drop null quotes', async () => {
      const quoteA = createQuote({last_price: 100});
      const quoteB = createQuote({last_price: 101});
      subscribe.mockReturnValue(of(quoteA, null, quoteB));

      const received = await firstValueFrom(service.getQuotesSubscription('SBER', 'MOEX').pipe(toArray()));

      expect(received).toEqual([quoteA, quoteB]);

      const [request, getKey] = subscribe.mock.calls[0];
      expect(request).toEqual({
        opcode: 'QuotesSubscribe',
        code: 'SBER',
        exchange: 'MOEX',
        format: 'simple',
        instrumentGroup: undefined
      });
      expect(getKey()).toBe('QuotesSubscribe_SBER_MOEX_undefined_simple');
    });
  });

  describe('getLastQuoteInfo', () => {
    const quotesUrl = `${apiUrl}/md/v2/Securities/MOEX:SBER/quotes`;

    it('should return the first quote from the response', () => {
      const quote = createQuote({last_price: 250});
      let result: Quote | null | undefined;

      service.getLastQuoteInfo('SBER', 'MOEX').subscribe(r => result = r);
      httpMock.expectOne(quotesUrl).flush([quote]);

      expect(result).toEqual(quote);
    });

    it('should return null when the response is empty', () => {
      let result: Quote | null | undefined;

      service.getLastQuoteInfo('SBER', 'MOEX').subscribe(r => result = r);
      httpMock.expectOne(quotesUrl).flush([]);

      expect(result).toBeNull();
    });

    it('should return null on an http error', () => {
      let result: Quote | null | undefined;

      service.getLastQuoteInfo('SBER', 'MOEX').subscribe(r => result = r);
      httpMock.expectOne(quotesUrl).flush('failure', {status: 500, statusText: 'Server Error'});

      expect(result).toBeNull();
    });
  });
});
