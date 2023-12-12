import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { interval, Observable, switchMap } from "rxjs";
import { NewsListItem } from "../models/news.model";
import { catchHttpError } from "../../../shared/utils/observable-helper";
import { ErrorHandlerService } from "../../../shared/services/handle-error/error-handler.service";
import { PositionsService } from "../../../shared/services/positions.service";
import { filter } from "rxjs/operators";
import { DashboardContextService } from "../../../shared/services/dashboard-context.service";
import { EnvironmentService } from "../../../shared/services/environment.service";

interface GetNewsParams {
  limit: number;
  offset: number;
  symbols?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class NewsService {
  private newsUrl = this.environmentService.apiUrl + '/news/news';

  constructor(
    private readonly environmentService: EnvironmentService,
    private http: HttpClient,
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
        catchHttpError<Array<NewsListItem>>([], this.errorHandlerService)
      );
  }

  public getNewsByPortfolio(params: GetNewsParams): Observable<NewsListItem[]> {
    return this.dashboardContextService.selectedPortfolio$
      .pipe(
        filter(p => !!p),
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
        catchHttpError<Array<NewsListItem>>([], this.errorHandlerService)
      );
  }

  public getNewNewsByPortfolio(): Observable<NewsListItem[]> {
    return this.dashboardContextService.selectedPortfolio$
      .pipe(
        filter(p => !!p),
        switchMap(p => this.positionsService.getAllByPortfolio(p!.portfolio, p!.exchange)),
        switchMap(positions => this.getNewNews((positions ?? []).map(p => p.symbol))),
      );
  }
}
