import {
  inject,
  Injectable
} from '@angular/core';
import {Observable} from "rxjs";
import {HttpClient} from "@angular/common/http";
import {map} from "rxjs/operators";
import {ErrorHandlerService} from '@terminal-core-lib/features/errors-handler/error-handler.service';
import {CORE_API_URL_PROVIDER} from '@terminal-core-lib/config/api-url-providers';
import {
  ClientRestriction,
  ClientsSearchFilter,
  ClientsSearchResponse,
  PageFilter,
  SortParams
} from '@terminal-widgets-lib/widgets/admin-clients/services/admin-clients-service.types';
import {catchHttpError} from '@terminal-core-lib/common/utils/observable/catch-http-error';
import {Market} from '@terminal-core-lib/features/instruments/graphql/schema/graphql.types';

@Injectable({
  providedIn: 'root'
})
export class AdminClientsService {
  private readonly httpClient = inject(HttpClient);

  private readonly errorHandlerService = inject(ErrorHandlerService);

  private readonly coreApiUrlProvider = inject(CORE_API_URL_PROVIDER);

  private readonly baseUrl = this.coreApiUrlProvider.apiUrl;

  searchClients(
    filters: ClientsSearchFilter | null,
    page: PageFilter | null,
    sort: SortParams | null
  ): Observable<ClientsSearchResponse | null> {
    const params: Record<string, string | number | boolean | readonly (string | number | boolean)[]> = {
      ...filters,
      ...page,
      ...sort
    };

    return this.httpClient.get<ClientsSearchResponse>(
      `${this.baseUrl}/admincomposer/clients`,
      {
        params
      }
    ).pipe(
      catchHttpError<ClientsSearchResponse | null>(null, this.errorHandlerService),
      map(r => {
        if (r == null) {
          return r;
        }

        return {
          total: r.total,
          items: r.items.map(item => ({
            ...item,
            market: item.market.toUpperCase() as Market
          }))
        };
      })
    );
  }

  addClientRecordToFavorites(portfolio: string, exchange: string): Observable<boolean> {
    {
      return this.httpClient.put(
        `${this.baseUrl}/admincomposer/portfolios/favorites`,
        {
          portfolio,
          exchange
        }
      ).pipe(
        catchHttpError<unknown>(false, this.errorHandlerService),
        map(r => {
          return r != false;
        })
      );
    }
  }

  removeClientRecordFromFavorites(portfolio: string, exchange: string): Observable<boolean> {
    {
      return this.httpClient.delete(
        `${this.baseUrl}/admincomposer/portfolios/favorites/${exchange}/${portfolio}`,
      ).pipe(
        catchHttpError<unknown>(false, this.errorHandlerService),
        map(r => {
          return r != false;
        })
      );
    }
  }

  getClientRestrictions(clientId: string): Observable<ClientRestriction[] | null> {
    return this.httpClient.get<ClientRestriction[]>(
      `${this.baseUrl}/admincomposer/clients/${clientId}/restrictions`,
    ).pipe(
      catchHttpError<ClientRestriction[] | undefined>(undefined, this.errorHandlerService),
      map(r => {
        if (r === undefined) {
          return null;
        }

        if (r == null) {
          return [];
        }

        return r.map(i => ({
          ...i,
          expiresAt: i.expiresAt != null ? new Date(i.expiresAt) : undefined
        }));
      })
    );
  }
}
