import { Injectable, inject } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import {Trade, TradeResponse} from "../models/trades/trade.model";
import { catchHttpError } from "../utils/observable-helper";
import { map } from "rxjs/operators";
import { ErrorHandlerService } from "./handle-error/error-handler.service";
import { EnvironmentService } from "./environment.service";
import {PortfolioItemsModelHelper} from "../utils/portfolio-item-models-helper";
import {PortfolioKey} from "../models/portfolio-key.model";
import { TradeFilter } from "../../modules/blotter/models/trade.model";
import {formatISO} from "date-fns";

@Injectable({
  providedIn: 'root'
})
export class TradesHistoryService {
  private readonly environmentService = inject(EnvironmentService);
  private readonly httpClient = inject(HttpClient);
  private readonly errorHandler = inject(ErrorHandlerService);

  getTradesHistoryForPortfolio(
    exchange: string,
    portfolio: string,
    options?: Partial<{
    dateFrom: Date | null;
    limit: number | null;
    filters: TradeFilter | null;
  }>): Observable<Trade[] | null> {
    const ownedPortfolio: PortfolioKey = { portfolio, exchange };
    const params: Record<string, any> = {
      descending: true,
      orderByTradeDate: true,
      format: 'heavy'
    };
    if (options) {
      if(options.filters != null) {
        if(options.filters.symbol != null && options.filters.symbol.length > 0) {
          params.ticker = options.filters.symbol;
        }

        if(options.filters.side != null) {
          params.side = options.filters.side;
        }
      }

      if (options.limit != null) {
        params.limit = options.limit;
      }

      if (options.dateFrom != null) {
        params.dateFrom = formatISO(options.dateFrom);
      }
    }
    return this.httpClient.get<TradeResponse[]>(
        `${this.environmentService.apiUrl}/md/v2/stats/${exchange}/${portfolio}/history/trades`,
      {
        params
      }
    ).pipe(
      catchHttpError<TradeResponse[] | null>(null, this.errorHandler),
      map(trades => {
        if (!trades) {
          return trades;
        }

        return trades.map(t => PortfolioItemsModelHelper.tradeResponseToModel(t, ownedPortfolio));
      })
    );
  }

  getTradesHistoryForSymbol(exchange: string, portfolio: string, symbol: string, options?: Partial<{
    from: string | null;
    limit: number | null;
  }>): Observable<Trade[] | null> {
    const ownedPortfolio: PortfolioKey = { portfolio, exchange };
    const params: Record<string, any> = {
      descending: true
    };

    if (options) {
      if (options.limit != null) {
        params.limit = options.limit;
      }

      if (options.from != null) {
        params.from = options.from;
      }
    }
    return this.httpClient.get<TradeResponse[]>(
      `${this.environmentService.apiUrl}/md/stats/${exchange}/${portfolio}/history/trades/${symbol}`,
      {
        params
      }
    ).pipe(
      catchHttpError<TradeResponse[] | null>(null, this.errorHandler),
      map(trades => {
        if (!trades) {
          return trades;
        }

        return trades.map(t => PortfolioItemsModelHelper.tradeResponseToModel(t, ownedPortfolio));
      })
    );
  }
}
