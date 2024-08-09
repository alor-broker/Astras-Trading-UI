import {Injectable} from '@angular/core';
import { HttpClient } from "@angular/common/http";
import {Observable, take} from "rxjs";
import {ErrorHandlerService} from "../handle-error/error-handler.service";
import {Order, StopOrder, StopOrderResponse} from "../../models/orders/order.model";
import {catchHttpError} from "../../utils/observable-helper";
import {PortfolioKey} from "../../models/portfolio-key.model";
import {map} from "rxjs/operators";
import { EnvironmentService } from "../environment.service";

@Injectable({
  providedIn: 'root'
})
export class OrderDetailsService {
  private readonly ordersUrl = `${this.environmentService.apiUrl}/md/v2/clients`;

  constructor(
    private readonly environmentService: EnvironmentService,
    private readonly httpClient: HttpClient,
    private readonly errorHandlerService: ErrorHandlerService
  ) {
  }

  getLimitOrderDetails(orderId: string, portfolioKey: PortfolioKey): Observable<Order | null> {
    return this.httpClient.get<Order>(`${this.ordersUrl}/${portfolioKey.exchange}/${portfolioKey.portfolio}/orders/${orderId}`).pipe(
      catchHttpError<Order | null>(null, this.errorHandlerService),
      map(order => {
        if(!order) {
          return order;
        }

        return {
          ...order,
          transTime: new Date(order.transTime),
          endTime: order.endTime ? new Date(order.endTime!) : undefined,
        };
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

        return {
          ...order,
          transTime: new Date(order.transTime),
          endTime: new Date(order.endTime!),
          triggerPrice: order.stopPrice,
          conditionType: order.condition
        };
      }),
      take(1)
    );
  }
}
