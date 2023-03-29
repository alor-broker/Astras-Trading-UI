import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../../environments/environment";
import { interval, Observable, switchMap } from "rxjs";
import { NewsListItem } from "../models/news.model";
import { catchHttpError } from "../../../shared/utils/observable-helper";
import { ErrorHandlerService } from "../../../shared/services/handle-error/error-handler.service";
import { Store } from "@ngrx/store";
import { selectedPortfolioKey } from "../../../store/dashboards/dashboards.selectors";
import { PositionsService } from "../../../shared/services/positions.service";
import { filter } from "rxjs/operators";

interface GetNewsParams {
  limit: number;
  offset: number;
  symbols?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class NewsService {
  private newsUrl = environment.apiUrl + '/news/news';

  constructor(
    private http: HttpClient,
    private readonly errorHandlerService: ErrorHandlerService,
    private readonly store: Store,
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
    return this.store.select(selectedPortfolioKey)
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
    return this.store.select(selectedPortfolioKey)
      .pipe(
        filter(p => !!p),
        switchMap(p => this.positionsService.getAllByPortfolio(p!.portfolio, p!.exchange)),
        switchMap(positions => this.getNewNews((positions ?? []).map(p => p.symbol))),
      );
  }
}
