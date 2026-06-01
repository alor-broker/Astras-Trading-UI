import {
  inject,
  Injectable
} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {ErrorHandlerService} from '../../errors-handler/error-handler.service';
import {
  USER_CONTEXT,
  UserContext
} from '../../user-context/user-context.types';
import {
  Observable,
  of,
  switchMap,
  take
} from 'rxjs';
import {catchHttpError} from '../../../common/utils/observable/catch-http-error';
import {
  CORE_API_URL_PROVIDER,
  CoreApiUrlProvider
} from '../../../config/api-url-providers';
import {
  Position,
  PositionWarpResponse
} from '@terminal-core-lib/features/portfolios/types/position.types';
import {PortfolioKey} from '@terminal-core-lib/common/types/portfolio.types';
import {map} from 'rxjs/operators';
import {PortfolioItemsModelHelper} from '@terminal-core-lib/features/portfolios/utils/portfolio-items-model.helper';

@Injectable()
export class AllPositionsService {
  private readonly httpClient = inject(HttpClient);

  private readonly errorHandlerService = inject(ErrorHandlerService);

  private readonly coreApiUrlProvider = inject<CoreApiUrlProvider>(CORE_API_URL_PROVIDER);

  private readonly userContext = inject<UserContext>(USER_CONTEXT);

  private readonly baseUrl = this.coreApiUrlProvider.apiUrl + '/md/v2/clients';

  getAllUserPositions(): Observable<PositionWarpResponse[] | null> {
    return this.userContext.getUser().pipe(
      take(1),
      switchMap((u) => {
          if (u.login == null) {
            return of(null);
          }

          return this.httpClient.get<PositionWarpResponse[]>(`${this.baseUrl}/${u.login}/positions`);
        }
      ),
      catchHttpError<PositionWarpResponse[] | null>(null, this.errorHandlerService),
    );
  }

  getAllByPortfolio(portfolio: string, exchange: string): Observable<Position[] | null> {
    const ownedPortfolio: PortfolioKey = {portfolio, exchange};
    return this.httpClient.get<PositionWarpResponse[]>(`${this.baseUrl}/${exchange}/${portfolio}/positions`).pipe(
      catchHttpError<PositionWarpResponse[] | null>(null, this.errorHandlerService),
      map(r => {
        if (r == null) {
          return null;
        }

        return r.map(i => PortfolioItemsModelHelper.positionResponseToModel(i, ownedPortfolio));
      }),
      take(1)
    );
  }
}
