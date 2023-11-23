import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../../environments/environment";
import { interval, Observable, switchMap } from "rxjs";
import { NewsListItem } from "../models/news.model";
import { catchHttpError } from "../../../shared/utils/observable-helper";
import { ErrorHandlerService } from "../../../shared/services/handle-error/error-handler.service";
import { PositionsService } from "../../../shared/services/positions.service";
import { DashboardContextService } from "../../../shared/services/dashboard-context.service";

interface GetNewsParams {
  limit: number;
  offset: number;
  symbols?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class NewsService {
  private readonly newsUrl = environment.apiUrl + '/news/news';

  constructor(
    private readonly http: HttpClient,
    private readonly errorHandlerService: ErrorHandlerService,
    private readonly dashboardContextService: DashboardContextService,
    private readonly positionsService: PositionsService
  ) {}

  public getNews(params: GetNewsParams): Observable<NewsListItem[]> {
    return this.http.get<NewsListItem[]>(`${this.newsUrl}`, {
      params: {
        limit: params.limit,
        offset: params.offset,
        sortDesc: true,
        symbols: params.symbols ?? []
      }
    })
      .pipe(
        catchHttpError<NewsListItem[]>([], this.errorHandlerService)
      );
  }

  public getNewsByPortfolio(params: GetNewsParams): Observable<NewsListItem[]> {
    return this.dashboardContextService.selectedPortfolio$
      .pipe(
        switchMap(p => this.positionsService.getAllByPortfolio(p!.portfolio, p!.exchange)),
        switchMap(positions => this.getNews({...params, symbols: (positions ?? []).map(p => p.symbol)}))
      );
  }

  public getNewNews(symbols: string[] = []): Observable<NewsListItem[]> {
    return interval(60_000)
      .pipe(
        switchMap(() => this.getNews({
            limit: 10,
            offset: 0,
            symbols
          })
        ),
        catchHttpError<NewsListItem[]>([], this.errorHandlerService)
      );
  }

  public getNewNewsByPortfolio(): Observable<NewsListItem[]> {
    return this.dashboardContextService.selectedPortfolio$
      .pipe(
        switchMap(p => this.positionsService.getAllByPortfolio(p!.portfolio, p!.exchange)),
        switchMap(positions => this.getNewNews((positions ?? []).map(p => p.symbol))),
      );
  }
}
