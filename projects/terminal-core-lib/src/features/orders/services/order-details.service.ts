import {
  inject,
  Injectable
} from '@angular/core';
import {ErrorHandlerService} from '../../errors-handler/error-handler.service';
import {
  Order,
  OrderResponse,
  StopOrder,
  StopOrderResponse
} from '../../portfolios/types/order.types';
import {PortfolioKey} from '../../../common/types/portfolio.types';
import {catchHttpError} from '../../../common/utils/observable/catch-http-error';
import {
  map,
  Observable,
  take
} from 'rxjs';
import {PortfolioItemsModelHelper} from '../../portfolios/utils/portfolio-items-model.helper';
import {CORE_API_URL_PROVIDER} from '../../../config/api-url-providers';
import {HttpClient} from '@angular/common/http';

@Injectable()
export class OrderDetailsService {
  private readonly coreApiUrlProvider = inject(CORE_API_URL_PROVIDER);

  private readonly httpClient = inject(HttpClient);

  private readonly errorHandlerService = inject(ErrorHandlerService);

  private readonly ordersUrl = `${this.coreApiUrlProvider.apiUrl}/md/v2/clients`;

  getLimitOrderDetails(orderId: string, portfolioKey: PortfolioKey): Observable<Order | null> {
    return this.httpClient.get<OrderResponse>(`${this.ordersUrl}/${portfolioKey.exchange}/${portfolioKey.portfolio}/orders/${orderId}`).pipe(
      catchHttpError<OrderResponse | null>(null, this.errorHandlerService),
      map(order => {
        if (!order) {
          return order;
        }

        return PortfolioItemsModelHelper.orderResponseToModel(order, portfolioKey);
      }),
      take(1)
    );
  }

  getStopOrderDetails(orderId: string, portfolioKey: PortfolioKey): Observable<StopOrder | null> {
    return this.httpClient.get<StopOrderResponse>(`${this.ordersUrl}/${portfolioKey.exchange}/${portfolioKey.portfolio}/stoporders/${orderId}`).pipe(
      catchHttpError<StopOrderResponse | null>(null, this.errorHandlerService),
      map(order => {
        if (!order) {
          return order;
        }

        return PortfolioItemsModelHelper.stopOrderResponseToModel(order, portfolioKey);
      }),
      take(1)
    );
  }
}
