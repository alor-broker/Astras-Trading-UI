import {
  inject,
  Injectable
} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {CLIENT_DATA_URLS_PROVIDER} from '@terminal-core-lib/config/api-url-providers';
import {ErrorHandlerService} from "@terminal-core-lib/features/errors-handler/error-handler.service";
import {
  HistoryFilterParams,
  HistoryItem
} from '@terminal-widgets-lib/widgets/mobile-home-screen/types/operations-history.types';
import {catchHttpError} from '@terminal-core-lib/common/utils/observable/catch-http-error';

@Injectable({
  providedIn: 'root'
})
export class OperationsHistoryService {
  private readonly clientDataUrlsProvider = inject(CLIENT_DATA_URLS_PROVIDER);

  private readonly httpClient = inject(HttpClient);

  private readonly errorHandlerService = inject(ErrorHandlerService);

  private readonly baseUrl = `${this.clientDataUrlsProvider.clientDataUrl}/client/v1.0/history`;

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
      {params: queryParams}
    ).pipe(
      catchHttpError<HistoryItem[] | null>(null, this.errorHandlerService)
    );
  }
}
