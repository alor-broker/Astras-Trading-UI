import {
  inject,
  Injectable
} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {ErrorHandlerService} from '@terminal-core-lib/features/errors-handler/error-handler.service';
import {CORE_API_URL_PROVIDER} from '@terminal-core-lib/config/api-url-providers';
import {
  PositionsSearchFilter,
  PositionsSearchResponse
} from '@terminal-widgets-lib/widgets/admin-client-positions/services/admin-client-positions-service.types';
import {
  PageFilter,
  SortParams
} from '@terminal-widgets-lib/widgets/admin-clients/services/admin-clients-service.types';
import {catchHttpError} from '@terminal-core-lib/common/utils/observable/catch-http-error';

@Injectable({
  providedIn: 'root'
})
export class AdminClientPositionsService {
  private readonly httpClient = inject(HttpClient);

  private readonly errorHandlerService = inject(ErrorHandlerService);

  private readonly coreApiUrlProvider = inject(CORE_API_URL_PROVIDER);

  private readonly baseUrl = this.coreApiUrlProvider.apiUrl;

  searchPositions(
    filters: PositionsSearchFilter | null,
    page: PageFilter | null,
    sort: SortParams | null
  ): Observable<PositionsSearchResponse | null> {
    const params: Record<string, string | number | boolean | readonly (string | number | boolean)[]> = {
      ...filters,
      ...page,
      ...sort
    };

    return this.httpClient.get<PositionsSearchResponse>(
      `${this.baseUrl}/admincomposer/positions`,
      {
        params
      }
    ).pipe(
      catchHttpError<PositionsSearchResponse | null>(null, this.errorHandlerService)
    );
  }
}
