import {
  inject,
  Injectable
} from '@angular/core';
import {CORE_API_URL_PROVIDER} from '../../../config/api-url-providers';
import {HttpClient} from '@angular/common/http';
import {
  Observable,
  take
} from 'rxjs';
import {ErrorHandlerService} from '../../errors-handler/error-handler.service';
import {catchHttpError} from '../../../common/utils/observable/catch-http-error';
import {CurrencyPair} from './exchange-rate-service.types';

@Injectable({providedIn: 'root'})
export class ExchangeRateService {
  private readonly apiUrlProvider = inject(CORE_API_URL_PROVIDER);

  private readonly httpClient = inject(HttpClient);

  private readonly errorHandlerService = inject(ErrorHandlerService);

  private readonly baseUrl = this.apiUrlProvider.apiUrl + '/md/v2/Securities';

  getCurrencyPairs(): Observable<CurrencyPair[] | null> {
    return this.httpClient.get<CurrencyPair[]>(`${this.baseUrl}/currencyPairs`).pipe(
      catchHttpError<CurrencyPair[] | null>(null, this.errorHandlerService),
      take(1)
    );
  }
}
