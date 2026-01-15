import { Injectable, inject } from '@angular/core';
import { Observable } from "rxjs";
import {
  ClientsSearchFilter,
  ClientsSearchResponse,
  PageFilter,
  SortParams
} from "./admin-clients-service.models";
import { HttpClient } from "@angular/common/http";
import { map } from "rxjs/operators";
import { ErrorHandlerService } from "../../../../shared/services/handle-error/error-handler.service";
import { EnvironmentService } from "../../../../shared/services/environment.service";
import { catchHttpError } from "../../../../shared/utils/observable-helper";
import { Market } from "../../../../../generated/graphql.types";

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
    const params: Record<string, string | number | boolean> = {
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
}
