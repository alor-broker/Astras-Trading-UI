import {TestBed} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import {ExchangeRateService} from './exchange-rate.service';
import {CORE_API_URL_PROVIDER} from '../../../config/api-url-providers';
import {ErrorHandlerService} from '../../errors-handler/error-handler.service';
import {CurrencyPair} from './exchange-rate-service.types';

describe('ExchangeRateService', () => {
  const apiUrl = 'https://api.test';
  const currencyPairsUrl = `${apiUrl}/md/v2/Securities/currencyPairs`;

  let service: ExchangeRateService;
  let httpMock: HttpTestingController;
  let errorHandler: { handleError: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    errorHandler = {handleError: vi.fn()};

    TestBed.configureTestingModule({
      providers: [
        ExchangeRateService,
        provideHttpClient(),
        provideHttpClientTesting(),
        {provide: CORE_API_URL_PROVIDER, useValue: {apiUrl}},
        {provide: ErrorHandlerService, useValue: errorHandler}
      ]
    });

    service = TestBed.inject(ExchangeRateService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should request currency pairs from the securities endpoint and return the response body', () => {
    const pairs: CurrencyPair[] = [{firstCode: 'USD', secondCode: 'RUB', symbolTom: 'USD000UTSTOM'}];
    let result: CurrencyPair[] | null | undefined;

    service.getCurrencyPairs().subscribe(r => result = r);

    const req = httpMock.expectOne(currencyPairsUrl);
    expect(req.request.method).toBe('GET');
    req.flush(pairs);

    expect(result).toEqual(pairs);
  });

  it('should return null and report the error when the request fails', () => {
    let result: CurrencyPair[] | null | undefined;

    service.getCurrencyPairs().subscribe(r => result = r);

    httpMock.expectOne(currencyPairsUrl).flush('failure', {status: 500, statusText: 'Server Error'});

    expect(result).toBeNull();
    expect(errorHandler.handleError).toHaveBeenCalledTimes(1);
  });

  it('should not report platform-inactive errors (status 0)', () => {
    let result: CurrencyPair[] | null | undefined;

    service.getCurrencyPairs().subscribe(r => result = r);

    httpMock.expectOne(currencyPairsUrl).flush('offline', {status: 0, statusText: 'Unknown Error'});

    expect(result).toBeNull();
    expect(errorHandler.handleError).not.toHaveBeenCalled();
  });
});
