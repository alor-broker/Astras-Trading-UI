import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../../environments/environment";
import { Observable } from "rxjs";
import { TreemapNode } from "../models/treemap.model";
import { catchHttpError } from "../../../shared/utils/observable-helper";
import { ErrorHandlerService } from "../../../shared/services/handle-error/error-handler.service";

@Injectable({
  providedIn: 'root'
})
export class TreemapService {
  private baseUrl = environment.apiUrl + '/instruments/v1/TreeMap';

  constructor(
    private readonly http: HttpClient,
    private readonly errorHandlerService: ErrorHandlerService
  ) { }

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
