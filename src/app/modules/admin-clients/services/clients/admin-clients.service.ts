import {
  inject,
  Injectable
} from '@angular/core';
import {Observable} from "rxjs";
import {
  ClientRestriction,
  ClientsSearchFilter,
  ClientsSearchResponse,
  PageFilter,
  SortParams
} from "./admin-clients-service.models";
import {HttpClient} from "@angular/common/http";
import {map} from "rxjs/operators";
import {ErrorHandlerService} from "../../../../shared/services/handle-error/error-handler.service";
import {EnvironmentService} from "../../../../shared/services/environment.service";
import {catchHttpError} from "../../../../shared/utils/observable-helper";
import {Market} from "../../../../../generated/graphql.types";

@Injectable({
  providedIn: 'root'
})
export class AdminClientsService {
  private readonly httpClient = inject(HttpClient);

  private readonly errorHandlerService = inject(ErrorHandlerService);

  private readonly environmentService = inject(EnvironmentService);

  private readonly baseUrl = this.environmentService.apiUrl;

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
        catchHttpError<any>(false, this.errorHandlerService),
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
        catchHttpError<any>(false, this.errorHandlerService),
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

        if(r == null) {
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
