import {TestBed} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import formatISO from 'date-fns/formatISO';
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
  const dateFrom = new Date('2026-03-15T00:00:00.000Z');
  const dateTo = new Date('2026-06-15T23:59:59.999Z');

  let service: PortfolioCommissionsService;
  let httpMock: HttpTestingController;
  let errorHandler: { handleError: ReturnType<typeof vi.fn> };

  beforeEach(() => {
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
  });

  it.each(Object.values(PortfolioCommissionPeriod))('should request commissions with passed date range for %s period', period => {
    service.getPortfolioCommissions(portfolio, period, dateFrom, dateTo).subscribe();

    const req = httpMock.expectOne(request => request.url === commissionsUrl);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('period')).toBe(period);
    expect(req.request.params.get('dateFrom')).toBe(formatISO(dateFrom));
    expect(req.request.params.get('dateTo')).toBe(formatISO(dateTo));

    req.flush([]);
  });

  it('should normalize commission data', () => {
    let result: PortfolioCommission[] | null | undefined;

    service.getPortfolioCommissions(portfolio, PortfolioCommissionPeriod.Week, dateFrom, dateTo).subscribe(response => result = response);

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

    service.getPortfolioCommissions(portfolio, PortfolioCommissionPeriod.Week, dateFrom, dateTo).subscribe(response => result = response);

    httpMock.expectOne(request => request.url === commissionsUrl).flush('failure', {status: 500, statusText: 'Server Error'});

    expect(result).toBeNull();
    expect(errorHandler.handleError).toHaveBeenCalledTimes(1);
  });
});
