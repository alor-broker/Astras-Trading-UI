import {
  inject,
  Injectable
} from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse
} from '@angular/common/http';
import {ErrorHandlerService} from '../../errors-handler/error-handler.service';
import {InstrumentKey} from '../../../common/types/instrument.types';
import {PortfolioKey} from '../../../common/types/portfolio.types';
import {Observable} from 'rxjs';
import {RisksInfo} from './risks-service.types';
import {ApplicationErrorHandler} from '../../errors-handler/errors-handler.types';
import {catchHttpError} from '../../../common/utils/observable/catch-http-error';
import {
  CORE_API_URL_PROVIDER,
  CoreApiUrlProvider
} from '../../../config/api-url-providers';

@Injectable({providedIn: 'root'})
export class RisksService {
  private readonly coreApiUrlProvider = inject<CoreApiUrlProvider>(CORE_API_URL_PROVIDER);

  private readonly httpClient = inject(HttpClient);

  private readonly errorHandlerService = inject(ErrorHandlerService);

  private readonly clientsRiskUrl = this.coreApiUrlProvider.apiUrl + '/commandapi/warptrans/FX1/v2/client/orders/clientsRisk';

  getRisksInfo(instrumentKey: InstrumentKey, portfolio: PortfolioKey): Observable<RisksInfo | null> {
    const errorHandler: ApplicationErrorHandler = {
      handleError: error => {
        if (error instanceof HttpErrorResponse) {
          if (error.status === 404) {
            return;
          }
        }

        this.errorHandlerService.handleError(error);
      }
    };

    return this.httpClient.get<RisksInfo>(
      this.clientsRiskUrl,
      {
        params: {
          portfolio: portfolio.portfolio,
          ticker: instrumentKey.symbol,
          exchange: instrumentKey.exchange
        }
      }
    ).pipe(
      catchHttpError<RisksInfo | null>(null, errorHandler)
    );
  }
}
