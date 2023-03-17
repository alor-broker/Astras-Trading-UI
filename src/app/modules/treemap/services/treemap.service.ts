import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../../environments/environment";
import { Observable } from "rxjs";
import { TreemapNode } from "../models/treemap.model";

@Injectable({
  providedIn: 'root'
})
export class TreemapService {
  private baseUrl = environment.apiUrl + '/instruments/v1/TreeMap';

  constructor(
    private readonly http: HttpClient
  ) { }

  getTreemap(): Observable<TreemapNode[]> {
    return this.http.get<TreemapNode[]>(this.baseUrl, {
      params: {
        market: 'fond',
        limit: 70
      }
    });
  }
}
