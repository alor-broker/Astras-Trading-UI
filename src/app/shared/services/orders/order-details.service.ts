import { Injectable, inject } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import {Observable, take} from "rxjs";
import {ErrorHandlerService} from "../handle-error/error-handler.service";
import {Order, OrderResponse, StopOrder, StopOrderResponse} from "../../models/orders/order.model";
import {catchHttpError} from "../../utils/observable-helper";
import {PortfolioKey} from "../../models/portfolio-key.model";
import {map} from "rxjs/operators";
import { EnvironmentService } from "../environment.service";
import {PortfolioItemsModelHelper} from "../../utils/portfolio-item-models-helper";

@Injectable({
  providedIn: 'root'
})
export class OrderDetailsService {
  private readonly environmentService = inject(EnvironmentService);
  private readonly httpClient = inject(HttpClient);
  private readonly errorHandlerService = inject(ErrorHandlerService);

  private readonly ordersUrl = `${this.environmentService.apiUrl}/md/v2/clients`;

  getLimitOrderDetails(orderId: string, portfolioKey: PortfolioKey): Observable<Order | null> {
    return this.httpClient.get<OrderResponse>(`${this.ordersUrl}/${portfolioKey.exchange}/${portfolioKey.portfolio}/orders/${orderId}`).pipe(
      catchHttpError<OrderResponse | null>(null, this.errorHandlerService),
      map(order => {
        if(!order) {
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
        if(!order) {
          return order;
        }

        return PortfolioItemsModelHelper.stopOrderResponseToModel(order, portfolioKey);
      }),
      take(1)
    );
  }
}
