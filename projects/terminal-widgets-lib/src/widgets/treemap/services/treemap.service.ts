import {
  inject,
  Injectable
} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {ErrorHandlerService} from '@terminal-core-lib/features/errors-handler/error-handler.service';
import {CORE_API_URL_PROVIDER} from '@terminal-core-lib/config/api-url-providers';
import {Observable} from 'rxjs';
import {TreemapNode} from "./treemap-service.types";
import {catchHttpError} from '@terminal-core-lib/common/utils/observable/catch-http-error';

@Injectable()
export class TreemapService {
  private readonly coreApiUrlProvider = inject(CORE_API_URL_PROVIDER);

  private readonly httpClient = inject(HttpClient);

  private readonly errorHandlerService = inject(ErrorHandlerService);

  private readonly baseUrl = this.coreApiUrlProvider.apiUrl + '/instruments/v1/TreeMap';

  getTreemap(limit: number): Observable<TreemapNode[]> {
    return this.httpClient.get<TreemapNode[]>(this.baseUrl, {
      params: {
        market: 'fond',
        limit
      }
    })
      .pipe(
        catchHttpError<TreemapNode[]>([], this.errorHandlerService)
      );
  }
}
