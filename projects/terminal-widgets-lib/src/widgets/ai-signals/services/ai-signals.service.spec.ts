import {TestBed} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import {firstValueFrom} from 'rxjs';
import {CORE_API_URL_PROVIDER} from '@terminal-core-lib/config/api-url-providers';
import {ErrorHandlerService} from '@terminal-core-lib/features/errors-handler/error-handler.service';
import {AiSignalsService} from './ai-signals.service';
import {SignalBatchResult, SignalInstrumentsResult} from './ai-signals-service.types';

describe('AiSignalsService', () => {
  const apiUrl = 'https://api.test';
  const expectedRequestUrl = `${apiUrl}/investai/signals/latest`;

  let service: AiSignalsService;
  let httpTestingController: HttpTestingController;
  let errorHandlerSpy: { handleError: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    errorHandlerSpy = {
      handleError: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {provide: CORE_API_URL_PROVIDER, useValue: {apiUrl}},
        {provide: ErrorHandlerService, useValue: errorHandlerSpy}
      ]
    });

    service = TestBed.inject(AiSignalsService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  describe('getInstruments', () => {
    it('should request the full instrument coverage without restricting tickers or status', async () => {
      const response: SignalInstrumentsResult = {instruments: [], count: 0};

      const resultPromise = firstValueFrom(service.getInstruments());

      const request = httpTestingController.expectOne(`${apiUrl}/investai/instruments`);
      expect(request.request.method).toBe('GET');
      expect(request.request.params.keys()).toEqual([]);
      request.flush(response);
      await expect(resultPromise).resolves.toEqual(response);
    });

    it('should return null and report an instrument request failure', async () => {
      const resultPromise = firstValueFrom(service.getInstruments());

      const request = httpTestingController.expectOne(`${apiUrl}/investai/instruments`);
      request.flush({detail: 'unavailable'}, {status: 503, statusText: 'Unavailable'});

      await expect(resultPromise).resolves.toBeNull();
      expect(errorHandlerSpy.handleError).toHaveBeenCalled();
    });
  });

  describe('getLatestSignals', () => {
    it('should request every selected ticker without the former ten-ticker limit', async () => {
      const tickers = Array.from({length: 48}, (value, index) => `TICKER${index}`);
      const resultPromise = firstValueFrom(service.getLatestSignals(tickers));

      const request = httpTestingController.expectOne(r => r.url === expectedRequestUrl);
      expect(request.request.params.get('tickers')).toBe(tickers.join(','));
      request.flush({signals: []});

      await expect(resultPromise).resolves.toEqual({signals: []});
    });

    it('should request the latest signals with normalized tickers', async () => {
      const response: SignalBatchResult = {schema_version: 'signal-1', signals: []};

      const resultPromise = firstValueFrom(service.getLatestSignals([' sber ', 'GAZP', 'sber', '']));

      const request = httpTestingController.expectOne(
        r => r.url === expectedRequestUrl && r.params.get('tickers') === 'SBER,GAZP'
      );
      expect(request.request.method).toBe('GET');
      request.flush(response);

      await expect(resultPromise).resolves.toEqual(response);
    });

    it('should emit null without an HTTP call for an empty tickers list', async () => {
      const result = await firstValueFrom(service.getLatestSignals([' ', '']));

      expect(result).toBeNull();
      httpTestingController.expectNone(() => true);
    });

    it('should emit null and report the error to the error handler on HTTP failure', async () => {
      const resultPromise = firstValueFrom(service.getLatestSignals(['SBER']));

      const request = httpTestingController.expectOne(r => r.url === expectedRequestUrl);
      request.flush({detail: 'db read failed'}, {status: 500, statusText: 'Internal Server Error'});

      await expect(resultPromise).resolves.toBeNull();
      expect(errorHandlerSpy.handleError).toHaveBeenCalled();
    });
  });
});
