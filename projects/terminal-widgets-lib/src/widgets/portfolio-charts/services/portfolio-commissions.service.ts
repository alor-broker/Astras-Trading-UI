import {
  inject,
  Injectable
} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import formatISO from 'date-fns/formatISO';
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
    period: PortfolioCommissionPeriod,
    dateFrom: Date,
    dateTo: Date
  ): Observable<PortfolioCommission[] | null> {
    return this.httpClient.get<PortfolioCommissionResponse[]>(
      `${this.baseUrl}/${portfolio}`,
      {
        params: {
          dateFrom: formatISO(dateFrom),
          dateTo: formatISO(dateTo),
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
}
