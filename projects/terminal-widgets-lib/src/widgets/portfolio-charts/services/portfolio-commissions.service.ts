import {
  inject,
  Injectable
} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import endOfDay from 'date-fns/endOfDay';
import formatISO from 'date-fns/formatISO';
import startOfDay from 'date-fns/startOfDay';
import subMonths from 'date-fns/subMonths';
import subYears from 'date-fns/subYears';
import {
  map,
  Observable,
  take
} from 'rxjs';
import {
  CORE_API_URL_PROVIDER,
  CoreApiUrlProvider
} from '@terminal-core-lib/config/api-url-providers';
import {ErrorHandlerService} from '@terminal-core-lib/features/errors-handler/error-handler.service';
import {catchHttpError} from '@terminal-core-lib/common/utils/observable/catch-http-error';
import {MathHelper} from '@terminal-core-lib/common/utils/math.helper';

export enum PortfolioCommissionPeriod {
  Week = 'week',
  Month = 'month',
  Year = 'year',
}

interface PortfolioCommissionResponse {
  account: string;
  periodStart: string;
  period: PortfolioCommissionPeriod;
  commissionAmount: number;
}

export interface PortfolioCommission {
  account: string;
  periodStart: Date;
  period: PortfolioCommissionPeriod;
  commissionAmount: number;
}

@Injectable({providedIn: 'root'})
export class PortfolioCommissionsService {
  private readonly httpClient = inject(HttpClient);

  private readonly coreApiUrlProvider = inject<CoreApiUrlProvider>(CORE_API_URL_PROVIDER);

  private readonly errorHandlerService = inject(ErrorHandlerService);

  private readonly baseUrl = `${this.coreApiUrlProvider.apiUrl}/client-analytics/v1/commissions/accounts`;

  getPortfolioCommissions(
    portfolio: string,
    period: PortfolioCommissionPeriod
  ): Observable<PortfolioCommission[] | null> {
    const datesRange = this.getDatesRange(period);

    return this.httpClient.get<PortfolioCommissionResponse[]>(
      `${this.baseUrl}/${portfolio}`,
      {
        params: {
          dateFrom: formatISO(datesRange.dateFrom),
          dateTo: formatISO(datesRange.dateTo),
          period
        }
      }
    ).pipe(
      catchHttpError<PortfolioCommissionResponse[] | null>(null, this.errorHandlerService),
      map(response => {
        if (response == null) {
          return response;
        }

        return response.map(item => ({
          ...item,
          commissionAmount: MathHelper.round(item.commissionAmount, 3),
          periodStart: new Date(item.periodStart)
        }));
      }),
      take(1)
    );
  }

  private getDatesRange(period: PortfolioCommissionPeriod): {
    dateFrom: Date;
    dateTo: Date;
  } {
    const now = new Date();

    switch (period) {
      case PortfolioCommissionPeriod.Month: {
        return {
          dateFrom: startOfDay(subYears(now, 1)),
          dateTo: endOfDay(now)
        };
      }
      case PortfolioCommissionPeriod.Year: {
        return {
          dateFrom: startOfDay(subYears(now, 10)),
          dateTo: endOfDay(now)
        };
      }
      default: {
        return {
          dateFrom: startOfDay(subMonths(now, 3)),
          dateTo: endOfDay(now)
        };
      }
    }
  }
}
