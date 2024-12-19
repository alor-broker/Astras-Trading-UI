import { Injectable } from '@angular/core';
import { EnvironmentService } from "../../../shared/services/environment.service";
import {
  HttpClient,
  HttpErrorResponse
} from "@angular/common/http";
import { ErrorHandlerService } from "../../../shared/services/handle-error/error-handler.service";
import { PortfolioKey } from "../../../shared/models/portfolio-key.model";
import { Observable } from "rxjs";
import { RisksInfo } from "../models/risks.model";
import { ApplicationErrorHandler } from "../../../shared/services/handle-error/error-handler";
import { catchHttpError } from "../../../shared/utils/observable-helper";
import { InstrumentKey } from "../../../shared/models/instruments/instrument-key.model";

@Injectable({
  providedIn: 'root'
})
export class RisksService {
  private readonly clientsRiskUrl = this.environmentService.apiUrl + '/commandapi/warptrans/FX1/v2/client/orders/clientsRisk';

  constructor(
    private readonly environmentService: EnvironmentService,
    private readonly httpClient: HttpClient,
    private readonly errorHandlerService: ErrorHandlerService
  ) {
  }

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
