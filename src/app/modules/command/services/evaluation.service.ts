import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { filter, Observable, switchMap } from 'rxjs';
import { PortfolioKey } from 'src/app/shared/models/portfolio-key.model';
import { environment } from 'src/environments/environment';
import { EvaluationBaseProperties } from '../models/evaluation-base-properties.model';
import { EvaluationRequest } from '../models/evaluation-request.model';
import { Evaluation } from '../models/evaluation.model';
import { getSelectedPortfolio } from '../../../store/portfolios/portfolios.selectors';
import { catchHttpError } from '../../../shared/utils/observable-helper';
import { ErrorHandlerService } from '../../../shared/services/handle-error/error-handler.service';

@Injectable({
  providedIn: 'root'
})
export class EvaluationService {
  private readonly url = environment.apiUrl + '/commandapi/warptrans/FX1/v2/client/orders/estimate';

  constructor(
    private readonly http: HttpClient,
    private readonly store: Store,
    private readonly errorHandlerService: ErrorHandlerService
  ) { }

  evaluateOrder(baseRequest: EvaluationBaseProperties) : Observable<Evaluation | null> {
    return this.store.select(getSelectedPortfolio).pipe(
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
}
