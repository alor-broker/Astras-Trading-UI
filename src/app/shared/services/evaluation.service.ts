import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  filter,
  Observable,
  of,
  switchMap,
  take
} from 'rxjs';
import { PortfolioKey } from 'src/app/shared/models/portfolio-key.model';
import { environment } from 'src/environments/environment';
import {
  EvaluationBaseProperties,
  QuantityEvaluationProperties
} from '../models/evaluation-base-properties.model';
import { EvaluationRequest } from '../models/evaluation-request.model';
import { Evaluation } from '../models/evaluation.model';
import { ErrorHandlerService } from './handle-error/error-handler.service';
import { getSelectedPortfolioKey } from '../../store/portfolios/portfolios.selectors';
import { catchHttpError } from '../utils/observable-helper';

@Injectable({
  providedIn: 'root'
})
export class EvaluationService {
  private readonly url = environment.apiUrl + '/commandapi/warptrans/FX1/v2/client/orders/estimate';

  constructor(
    private readonly http: HttpClient,
    private readonly store: Store,
    private readonly errorHandlerService: ErrorHandlerService
  ) {
  }

  evaluateOrder(baseRequest: EvaluationBaseProperties): Observable<Evaluation | null> {
    return this.store.select(getSelectedPortfolioKey).pipe(
      filter((pk): pk is PortfolioKey => !!pk),
      switchMap(portfolio => {
        return this.http.post<Evaluation>(this.url, {
          portfolio: portfolio.portfolio,
          ticker: baseRequest.instrument.symbol,
          exchange: baseRequest.instrument.exchange,
          board: baseRequest.instrument.instrumentGroup,
          price: baseRequest.price,
          lotQuantity: baseRequest.lotQuantity,
        } as EvaluationRequest);
      }),
      catchHttpError<Evaluation | null>(null, this.errorHandlerService)
    );
  }

  evaluateQuantity(portfolio: string, items: QuantityEvaluationProperties[]): Observable<Evaluation[] | null> {
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
