import {TestBed} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import endOfDay from 'date-fns/endOfDay';
import formatISO from 'date-fns/formatISO';
import startOfDay from 'date-fns/startOfDay';
import subMonths from 'date-fns/subMonths';
import subYears from 'date-fns/subYears';
import {CORE_API_URL_PROVIDER} from '@terminal-core-lib/config/api-url-providers';
import {ErrorHandlerService} from '@terminal-core-lib/features/errors-handler/error-handler.service';
import {
  PortfolioCommission,
  PortfolioCommissionPeriod,
  PortfolioCommissionsService
} from './portfolio-commissions.service';

describe('PortfolioCommissionsService', () => {
  const apiUrl = 'https://api.test';
  const portfolio = 'D49300';
  const commissionsUrl = `${apiUrl}/client-analytics/v1/commissions/accounts/${portfolio}`;
  const currentDate = new Date('2026-06-15T12:34:56.000Z');

  let service: PortfolioCommissionsService;
  let httpMock: HttpTestingController;
  let errorHandler: { handleError: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(currentDate);

    errorHandler = {handleError: vi.fn()};

    TestBed.configureTestingModule({
      providers: [
        PortfolioCommissionsService,
        provideHttpClient(),
        provideHttpClientTesting(),
        {provide: CORE_API_URL_PROVIDER, useValue: {apiUrl}},
        {provide: ErrorHandlerService, useValue: errorHandler}
      ]
    });

    service = TestBed.inject(PortfolioCommissionsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    vi.useRealTimers();
  });

  it.each([
    [PortfolioCommissionPeriod.Week, formatISO(startOfDay(subMonths(currentDate, 3)))],
    [PortfolioCommissionPeriod.Month, formatISO(startOfDay(subYears(currentDate, 1)))],
    [PortfolioCommissionPeriod.Year, formatISO(startOfDay(subYears(currentDate, 10)))]
  ])('should request commissions with the date range for %s period', (period, expectedDateFrom) => {
    service.getPortfolioCommissions(portfolio, period).subscribe();

    const req = httpMock.expectOne(request => request.url === commissionsUrl);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('period')).toBe(period);
    expect(req.request.params.get('dateFrom')).toBe(expectedDateFrom);
    expect(req.request.params.get('dateTo')).toBe(formatISO(endOfDay(currentDate)));

    req.flush([]);
  });

  it('should normalize commission data', () => {
    let result: PortfolioCommission[] | null | undefined;

    service.getPortfolioCommissions(portfolio, PortfolioCommissionPeriod.Week).subscribe(response => result = response);

    httpMock.expectOne(request => request.url === commissionsUrl).flush([
      {
        account: portfolio,
        periodStart: '2026-06-01T00:00:00Z',
        period: PortfolioCommissionPeriod.Week,
        commissionAmount: 981.3333333
      }
    ]);

    expect(result).toEqual([
      {
        account: portfolio,
        periodStart: new Date('2026-06-01T00:00:00Z'),
        period: PortfolioCommissionPeriod.Week,
        commissionAmount: 981.333
      }
    ]);
  });

  it('should return null and report the error when the request fails', () => {
    let result: unknown;

    service.getPortfolioCommissions(portfolio, PortfolioCommissionPeriod.Week).subscribe(response => result = response);

    httpMock.expectOne(request => request.url === commissionsUrl).flush('failure', {status: 500, statusText: 'Server Error'});

    expect(result).toBeNull();
    expect(errorHandler.handleError).toHaveBeenCalledTimes(1);
  });
});
