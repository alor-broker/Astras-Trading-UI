import {HttpClient} from '@angular/common/http';
import {
  inject,
  Injectable
} from '@angular/core';
import {
  Observable,
  of,
  take
} from 'rxjs';
import {CORE_API_URL_PROVIDER} from '../../../config/api-url-providers';
import {ErrorHandlerService} from '../../errors-handler/error-handler.service';
import {
  Evaluation,
  EvaluationRequest,
  MultiOrderEvaluationItem,
  SingleOrderEvaluation
} from './evaluation-service.types';
import {catchHttpError} from '../../../common/utils/observable/catch-http-error';

@Injectable()
export class EvaluationService {
  private readonly coreApiUrlProvider = inject(CORE_API_URL_PROVIDER);

  private readonly http = inject(HttpClient);

  private readonly errorHandlerService = inject(ErrorHandlerService);

  private readonly url = this.coreApiUrlProvider.apiUrl + '/commandapi/warptrans/FX1/v2/client/orders/estimate';

  evaluateOrder(baseRequest: SingleOrderEvaluation): Observable<Evaluation | null> {
    return this.http.post<Evaluation>(this.url, {
      portfolio: baseRequest.portfolio,
      ticker: baseRequest.instrument.symbol,
      exchange: baseRequest.instrument.exchange,
      board: baseRequest.instrument.instrumentGroup,
      price: baseRequest.price,
      lotQuantity: baseRequest.lotQuantity,
      includeLimitOrders: true
    } as EvaluationRequest).pipe(
      catchHttpError<Evaluation | null>(null, this.errorHandlerService)
    );
  }

  evaluateBatch(portfolio: string, items: MultiOrderEvaluationItem[]): Observable<Evaluation[] | null> {
    if (items.length === 0) {
      return of([]);
    }

    return this.http.post<Evaluation[]>(
      `${this.url}/all`,
      items.map(i => ({
        portfolio: portfolio,
        ticker: i.instrumentKey.symbol,
        exchange: i.instrumentKey.exchange,
        board: i.instrumentKey.instrumentGroup,
        budget: i.budget,
        price: i.price
      } as EvaluationRequest))
    ).pipe(
      take(1),
      catchHttpError<Evaluation[] | null>(null, this.errorHandlerService)
    );
  }
}
