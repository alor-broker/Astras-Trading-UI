import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import {EnvironmentService} from "./environment.service";
import {ErrorHandlerService} from "./handle-error/error-handler.service";
import {catchHttpError} from "../utils/observable-helper";

interface GetNewsParams {
  limit: number;
  offset: number;
  symbols: string[] | null;
}

export interface NewsListItem {
  id: string;
  sourceId: string;
  header: string;
  publishDate: string;
  newsType: number;
  content: string;
  countryCodes: string[];
  rubricCodes: string[];
  symbols: string[];
  mt: null;
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
