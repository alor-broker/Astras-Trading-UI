import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EnvironmentService } from '../../../shared/services/environment.service';
import { ErrorHandlerService } from '../../../shared/services/handle-error/error-handler.service';
import { catchHttpError } from '../../../shared/utils/observable-helper';
import { HistoryItem, HistoryFilterParams } from '../models/operations-history.models';

@Injectable({
  providedIn: 'root'
})
export class OperationsHistoryService {
  private readonly environmentService = inject(EnvironmentService);
  private readonly httpClient = inject(HttpClient);
  private readonly errorHandlerService = inject(ErrorHandlerService);

  private readonly baseUrl = `${this.environmentService.clientDataUrl}/client/v1.0/history`;

  getHistory(agreementId: string, params: HistoryFilterParams = {}): Observable<HistoryItem[] | null> {
    const queryParams: Record<string, string> = {
      limit: params.limit?.toString() ?? '30',
      loadDocuments: 'true'
    };

    if (params.offset != null) {
      queryParams.offset = params.offset.toString();
    }
    if (params.dateFrom != null) {
      queryParams.dateFrom = params.dateFrom;
    }
    if (params.dateTo != null) {
      queryParams.dateTo = params.dateTo;
    }
    if (params.status != null) {
      queryParams.status = params.status;
    }
    if (params.search != null) {
      queryParams.search = params.search;
    }
    if (params.searchType != null) {
      queryParams.searchType = params.searchType;
    }

    return this.httpClient.get<HistoryItem[]>(
      `${this.baseUrl}/${agreementId}/all`,
      { params: queryParams }
    ).pipe(
      catchHttpError<HistoryItem[] | null>(null, this.errorHandlerService)
    );
  }
}
