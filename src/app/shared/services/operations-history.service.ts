import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EnvironmentService } from './environment.service';
import { ErrorHandlerService } from './handle-error/error-handler.service';
import { catchHttpError } from '../utils/observable-helper';
import { HistoryItem, HistoryRequestParams } from '../models/operations-history.models';

@Injectable({
  providedIn: 'root'
})
export class OperationsHistoryService {
  private readonly environmentService = inject(EnvironmentService);
  private readonly httpClient = inject(HttpClient);
  private readonly errorHandlerService = inject(ErrorHandlerService);

  private readonly baseUrl = `${this.environmentService.clientDataUrl}/client/v1.0/history`;

  getHistory(agreementId: string, params: HistoryRequestParams = {}): Observable<HistoryItem[] | null> {
    let httpParams = new HttpParams();

    // Default limit
    httpParams = httpParams.set('limit', params.limit?.toString() ?? '30');

    if (params.offset != null) {
      httpParams = httpParams.set('offset', params.offset.toString());
    }
    if (params.dateFrom) {
      httpParams = httpParams.set('dateFrom', params.dateFrom);
    }
    if (params.dateTo) {
      httpParams = httpParams.set('dateTo', params.dateTo);
    }
    if (params.status) {
      httpParams = httpParams.set('status', params.status);
    }

    return this.httpClient.get<HistoryItem[]>(
      `${this.baseUrl}/${agreementId}/operations`,
      {
        headers: {
          'X-ALOR-Originator': 'mobileapp'
        },
        params: httpParams
      }
    ).pipe(
      catchHttpError<HistoryItem[] | null>(null, this.errorHandlerService)
    );
  }
}
