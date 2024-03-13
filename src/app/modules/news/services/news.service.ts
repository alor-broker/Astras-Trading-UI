import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { NewsListItem } from "../models/news.model";
import { catchHttpError } from "../../../shared/utils/observable-helper";
import { ErrorHandlerService } from "../../../shared/services/handle-error/error-handler.service";
import { EnvironmentService } from "../../../shared/services/environment.service";
import { map } from "rxjs/operators";

interface GetNewsParams {
  limit: number;
  offset: number;
  symbols: string[] | null;
}

@Injectable({
  providedIn: 'root'
})
export class NewsService {
  private readonly newsUrl = this.environmentService.apiUrl + '/news/news';

  constructor(
    private readonly environmentService: EnvironmentService,
    private readonly http: HttpClient,
    private readonly errorHandlerService: ErrorHandlerService
  ) {
  }

  getNews(params: GetNewsParams): Observable<NewsListItem[]> {
    return this.http.get<NewsListItem[]>(`${this.newsUrl}`, {
      params: {
        limit: params.limit,
        offset: params.offset,
        sortDesc: true,
        symbols: params.symbols ?? []
      }
    })
      .pipe(
        catchHttpError<NewsListItem[]>([], this.errorHandlerService),
        map(news => news.map(n => ({ ...n, id: n.id.toString() })))
      );
  }
}
