import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../../environments/environment";
import { Observable } from "rxjs";
import { NewsListItem } from "../models/news.model";
import { catchHttpError } from "../../../shared/utils/observable-helper";
import { ErrorHandlerService } from "../../../shared/services/handle-error/error-handler.service";

interface GetNewsParams {
  limit: number;
  offset: number;
}

@Injectable({
  providedIn: 'root'
})
export class NewsService {
  private newsUrl = environment.apiUrl + '/news/news';

  constructor(
    private http: HttpClient,
    private readonly errorHandlerService: ErrorHandlerService
  ) {}

  public getNews(params: GetNewsParams): Observable<NewsListItem[]> {
    return this.http.get<NewsListItem[]>(`${this.newsUrl}`, {
      params: {
        limit: params.limit,
        offset: params.offset,
        sortDesc: true
      }
    })
      .pipe(
        catchHttpError<Array<NewsListItem>>([], this.errorHandlerService)
      );
  }
}
