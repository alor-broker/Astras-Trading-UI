import {
  inject,
  Injectable
} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {ErrorHandlerService} from "../../../shared/services/handle-error/error-handler.service";
import {EnvironmentService} from "../../../shared/services/environment.service";
import {Observable} from "rxjs";
import {catchHttpError} from "../../../shared/utils/observable-helper";
import {
  PageFilter,
  PositionsSearchFilter,
  PositionsSearchResponse,
  SortParams
} from "./admin-client-positions-service.models";

@Injectable({
  providedIn: 'root'
})
export class AdminClientPositionsService {
  private readonly httpClient = inject(HttpClient);

  private readonly errorHandlerService = inject(ErrorHandlerService);

  private readonly environmentService = inject(EnvironmentService);

  private readonly baseUrl = this.environmentService.apiUrl;

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
