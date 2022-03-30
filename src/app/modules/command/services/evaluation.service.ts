import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { filter, Observable, switchMap } from 'rxjs';
import { PortfolioKey } from 'src/app/shared/models/portfolio-key.model';
import { SyncService } from 'src/app/shared/services/sync.service';
import { environment } from 'src/environments/environment';
import { EvaluationBaseProperties } from '../models/evaluation-base-properties.model';
import { EvaluationRequest } from '../models/evaluation-request.model';
import { Evaluation } from '../models/evaluation.model';

@Injectable({
  providedIn: 'root'
})
export class EvaluationService {
  private readonly url = environment.apiUrl + '/commandapi/warptrans/FX1/v2/client/orders/estimate'
  constructor(private http: HttpClient, private sync: SyncService) { }
  evaluateOrder(baseRequest: EvaluationBaseProperties) : Observable<Evaluation> {
    return this.sync.selectedPortfolio$.pipe(
      filter((pk): pk is PortfolioKey => !!pk),
      switchMap(portfolio => {
        return this.http.post<Evaluation>(this.url, {
          portfolio: portfolio.portfolio,
          ticker: baseRequest.instrument.symbol,
          exchange: baseRequest.instrument.exchange,
          board: baseRequest.instrument.instrumentGroup,
          price: baseRequest.price,
          lotQuantity: baseRequest.lotQuantity,
          currency: 'RUB'
        } as EvaluationRequest);
      })
    )
  }
}
