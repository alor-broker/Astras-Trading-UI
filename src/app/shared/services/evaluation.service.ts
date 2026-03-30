import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {Observable, of, take} from 'rxjs';
import {EvaluationBaseProperties, QuantityEvaluationProperties} from '../models/evaluation-base-properties.model';
import {EvaluationRequest} from '../models/evaluation-request.model';
import {Evaluation} from '../models/evaluation.model';
import {ErrorHandlerService} from './handle-error/error-handler.service';
import {catchHttpError} from '../utils/observable-helper';
import { EnvironmentService } from "./environment.service";

@Injectable({
  providedIn: 'root'
})
export class EvaluationService {
  private readonly environmentService = inject(EnvironmentService);
  private readonly http = inject(HttpClient);
  private readonly errorHandlerService = inject(ErrorHandlerService);

  private readonly url = this.environmentService.apiUrl + '/commandapi/warptrans/FX1/v2/client/orders/estimate';

  evaluateOrder(baseRequest: EvaluationBaseProperties): Observable<Evaluation | null> {
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

  evaluateBatch(portfolio: string, items: QuantityEvaluationProperties[]): Observable<Evaluation[] | null> {
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
