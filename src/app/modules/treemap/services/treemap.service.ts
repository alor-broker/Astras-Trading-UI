import { Injectable, inject } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { TreemapNode } from "../models/treemap.model";
import { catchHttpError } from "../../../shared/utils/observable-helper";
import { ErrorHandlerService } from "../../../shared/services/handle-error/error-handler.service";
import { EnvironmentService } from "../../../shared/services/environment.service";

@Injectable({
  providedIn: 'root'
})
export class TreemapService {
  private readonly environmentService = inject(EnvironmentService);
  private readonly http = inject(HttpClient);
  private readonly errorHandlerService = inject(ErrorHandlerService);

  private readonly baseUrl = this.environmentService.apiUrl + '/instruments/v1/TreeMap';

  getTreemap(limit: number): Observable<TreemapNode[]> {
    return this.http.get<TreemapNode[]>(this.baseUrl, {
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
