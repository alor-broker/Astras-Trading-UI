import {
  inject,
  Injectable
} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {
  map,
  Observable
} from "rxjs";
import {formatISO} from "date-fns";
import {CORE_API_URL_PROVIDER} from '../../../config/api-url-providers';
import {ErrorHandlerService} from '../../errors-handler/error-handler.service';
import {TradeFilter} from './trade-history-service.types';
import {
  Trade,
  TradeResponse
} from '../../portfolios/types/trade.types';
import {PortfolioKey} from '../../../common/types/portfolio.types';
import {catchHttpError} from '../../../common/utils/observable/catch-http-error';
import {PortfolioItemsModelHelper} from '../../portfolios/utils/portfolio-items-model.helper';

@Injectable({providedIn: 'root'})
export class TradesHistoryService {
  private readonly coreApiUrlProvider = inject(CORE_API_URL_PROVIDER);

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
    const ownedPortfolio: PortfolioKey = {portfolio, exchange};
    const params: Record<string, any> = {
      descending: true,
      orderByTradeDate: true,
      format: 'heavy'
    };
    if (options) {
      if (options.filters != null) {
        if (options.filters.symbol != null && options.filters.symbol.length > 0) {
          params.ticker = options.filters.symbol;
        }

        if (options.filters.side != null) {
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
      `${this.coreApiUrlProvider.apiUrl}/md/v2/stats/${exchange}/${portfolio}/history/trades`,
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
    const ownedPortfolio: PortfolioKey = {portfolio, exchange};
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
      `${this.coreApiUrlProvider.apiUrl}/md/stats/${exchange}/${portfolio}/history/trades/${symbol}`,
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
