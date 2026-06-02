import {
  inject,
  Injectable
} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {ErrorHandlerService} from '../../errors-handler/error-handler.service';
import {
  map,
  Observable,
  switchMap,
  take
} from 'rxjs';
import {
  FullName,
  PortfolioDynamics
} from './account-service.types';
import {catchHttpError} from '../../../common/utils/observable/catch-http-error';
import {
  USER_CONTEXT,
  UserContext
} from '../../user-context/user-context.types';
import {PortfolioMeta} from '../../../common/types/portfolio.types';
import {
  CLIENT_DATA_URLS_PROVIDER,
  ClientDataUrlsProvider
} from '../../../config/api-url-providers';

@Injectable()
export class AccountService {
  private readonly clientDataUrlsProvider = inject<ClientDataUrlsProvider>(CLIENT_DATA_URLS_PROVIDER);

  private readonly httpClient = inject(HttpClient);

  private readonly userContext = inject<UserContext>(USER_CONTEXT);

  private readonly errorHandlerService = inject(ErrorHandlerService);

  private readonly accountUrl = this.clientDataUrlsProvider.clientDataUrl + '/client/v1.0';

  private readonly accountUrl2 = this.clientDataUrlsProvider.clientDataUrl + '/client/v2.0';

  getFullName(): Observable<FullName | null> {
    return this.userContext.getUser().pipe(
      take(1),
      switchMap((u) =>
        this.httpClient.get<FullName>(`${this.accountUrl}/users/${u.login}/full-name`)
      ),
      catchHttpError<FullName | null>(null, this.errorHandlerService),
    );
  }

  getAllPortfolios(): Observable<PortfolioMeta[] | null> {
    return this.userContext.getUser().pipe(
      take(1),
      switchMap(u =>
        this.httpClient.get<PortfolioMeta[]>(`${this.accountUrl}/users/${u.clientId}/all-portfolios`)
      ),
      catchHttpError<PortfolioMeta[] | null>(null, this.errorHandlerService)
    );
  }

  getPortfolioDynamicsForAgreement(
    agreement: string,
    fromDate: Date,
    toDate: Date
  ): Observable<PortfolioDynamics | null> {
    return this.httpClient.get<PortfolioDynamics>(
      `${this.accountUrl2}/agreements/${agreement}/portfolios/any/dynamics`,
      {
        params: {
          startDate: fromDate.toISOString(),
          endDate: toDate.toISOString()
        }
      }
    ).pipe(
      catchHttpError<PortfolioDynamics | null>(null, this.errorHandlerService),
      map(r => {
        if (r == null) {
          return r;
        }

        return {
          ...r,
          portfolioValues: r.portfolioValues.map(i => ({
            ...i,
            date: new Date(i.date)
          }))
        };
      }),
      take(1)
    );
  }
}
