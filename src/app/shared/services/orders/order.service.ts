import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse
} from "@angular/common/http";
import {
  forkJoin,
  Observable,
  of,
  switchMap,
  take,
  tap
} from "rxjs";
import {
  catchError,
  map
} from "rxjs/operators";
import { environment } from "../../../../environments/environment";
import { ErrorHandlerService } from "../handle-error/error-handler.service";
import {
  LimitOrder,
  LimitOrderEdit,
  MarketOrder,
  StopLimitOrder,
  StopLimitOrderEdit,
  StopMarketOrder,
  StopMarketOrderEdit,
  SubmitOrderResponse,
  SubmitOrderResult
} from "../../../modules/command/models/order.model";
import { toUnixTimestampSeconds } from "../../utils/datetime";
import { GuidGenerator } from "../../utils/guid";
import { httpLinkRegexp } from "../../utils/regexps";
import { InstantNotificationsService } from '../instant-notifications.service';
import { OrdersInstantNotificationType } from '../../models/terminal-settings/terminal-settings.model';
import { OrdersGroupService } from "./orders-group.service";
import { OrderCancellerService } from "../order-canceller.service";
import { ExecutionPolicy } from "../../models/orders/orders-group.model";

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private readonly baseApiUrl = environment.apiUrl + '/commandapi/warptrans/TRADE/v2/client/orders/actions';

  constructor(
    private readonly httpService: HttpClient,
    private readonly instantNotificationsService: InstantNotificationsService,
    private readonly errorHandlerService: ErrorHandlerService,
    private readonly ordersGroupService: OrdersGroupService,
    private readonly canceller: OrderCancellerService,
  ) {
  }

  submitMarketOrder(order: MarketOrder, portfolio: string): Observable<SubmitOrderResult> {
    return this.submitOrder(
      portfolio,
      () => ({
        url: `${this.baseApiUrl}/market`,
        body: {
          ...order
        }
      })
    );
  }

  submitLimitOrder(order: LimitOrder, portfolio: string): Observable<SubmitOrderResult> {
    return this.submitOrder(
      portfolio,
      () => ({
        url: `${this.baseApiUrl}/limit`,
        body: {
          ...order
        }
      })
    );
  }

  submitStopMarketOrder(order: StopMarketOrder, portfolio: string): Observable<SubmitOrderResult> {
    return this.submitOrder(
      portfolio,
      () => ({
        url: `${this.baseApiUrl}/stop`,
        body: {
          ...order,
          stopEndUnixTime: this.prepareStopEndUnixTimeValue(order)
        }
      })
    );
  }

  submitStopLimitOrder(order: StopLimitOrder, portfolio: string): Observable<SubmitOrderResult> {
    return this.submitOrder(
      portfolio,
      () => ({
        url: `${this.baseApiUrl}/stopLimit`,
        body: {
          ...order,
          stopEndUnixTime: this.prepareStopEndUnixTimeValue(order)
        }
      })
    );
  }

  submitLimitOrderEdit(orderEdit: LimitOrderEdit, portfolio: string): Observable<SubmitOrderResult> {
    return this.submitOrderEdit(
      portfolio,
      () => ({
        url: `${this.baseApiUrl}/limit/${orderEdit.id}`,
        body: {
          ...orderEdit
        }
      })
    );
  }

  submitStopMarketOrderEdit(orderEdit: StopMarketOrderEdit, portfolio: string): Observable<SubmitOrderResult> {
    return this.submitOrderEdit(
      portfolio,
      () => ({
        url: `${this.baseApiUrl}/stop/${orderEdit.id}`,
        body: {
          ...orderEdit,
          stopEndUnixTime: orderEdit.endTime,
        }
      })
    );
  }

  submitStopLimitOrderEdit(orderEdit: StopLimitOrderEdit, portfolio: string): Observable<SubmitOrderResult> {
    return this.submitOrderEdit(
      portfolio,
      () => ({
        url: `${this.baseApiUrl}/stopLimit/${orderEdit.id}`,
        body: {
          ...orderEdit,
          stopEndUnixTime: orderEdit.endTime,
        }
      })
    );
  }

  submitOrdersGroup(
    orders: ((LimitOrder | StopLimitOrder | StopMarketOrder) & { type: 'Limit' | 'StopLimit' | 'Stop' })[],
    portfolio: string,
    executionPolicy: ExecutionPolicy
  ): Observable<SubmitOrderResult> {

    return forkJoin(orders.map(o => {
      switch (o.type) {
        case 'Limit':
          return this.submitLimitOrder(o as LimitOrder, portfolio);
        case 'Stop':
          return this.submitStopMarketOrder(o as StopMarketOrder, portfolio);
        case 'StopLimit':
          return this.submitStopLimitOrder(o as StopLimitOrder, portfolio);
        default:
          return this.submitLimitOrder(o as LimitOrder, portfolio);
      }
    }))
      .pipe(
        switchMap(ordersRes => {
          if (!ordersRes.length) {
            return of({isSuccess: false});
          }

          const orderIds = ordersRes
            .filter(or => !!or.orderNumber)
            .map(or => or.orderNumber!);


          if (orderIds.length !== orders.length) {
            return forkJoin(ordersRes.map((ord, i) => ord.orderNumber
              ? this.canceller.cancelOrder({
                  orderid: ord.orderNumber!,
                  portfolio,
                  exchange: orders[i].instrument.exchange,
                  stop: orders[i].type !== 'Limit'
                })
              : of(null)
              )
            )
              .pipe(
                map(() => ({isSuccess: false}))
              );
          }

          return this.ordersGroupService.createOrdersGroup({
            orders: ordersRes.map((orderRes, i) => ({
              orderId: orderRes.orderNumber!,
              exchange: orders[i].instrument.exchange,
              portfolio: portfolio,
              type: orders[i].type
            })),
            executionPolicy
          });
        })
      );
  }

  private prepareStopEndUnixTimeValue(order: StopMarketOrder): number | null {
    if (!order.stopEndUnixTime) {
      return 0;
    }

    if (typeof order.stopEndUnixTime === 'number') {
      return Number((order.stopEndUnixTime / 1000).toFixed(0));
    } else {
      return toUnixTimestampSeconds(order.stopEndUnixTime);
    }
  }

  private submitOrder(portfolio: string, prepareOrderRequest: () => { url: string, body: any }): Observable<SubmitOrderResult> {
    return this.submitRequest(
      portfolio,
      'post',
      prepareOrderRequest,
      error => {
        if (!(error instanceof HttpErrorResponse)) {
          this.errorHandlerService.handleError(error);
        } else {
          this.handleCommandError(OrdersInstantNotificationType.OrderSubmitFailed, error, 'Заявка не выставлена');
        }
      }
    ).pipe(
      tap(result => {
        if (result.isSuccess) {
          this.instantNotificationsService.showNotification(
            OrdersInstantNotificationType.OrderCreated,
            'success',
            `Заявка выставлена`,
            `Заявка успешно выставлена, её номер на бирже: \n ${result.orderNumber}`
          );
        }
      })
    );
  }

  private submitOrderEdit(portfolio: string, prepareOrderRequest: () => { url: string, body: any }): Observable<SubmitOrderResult> {
    return this.submitRequest(
      portfolio,
      'put',
      prepareOrderRequest,
      error => {
        if (!(error instanceof HttpErrorResponse)) {
          this.errorHandlerService.handleError(error);
        } else {
          this.handleCommandError(OrdersInstantNotificationType.OrderUpdateFailed, error, 'Заявка не изменена');
        }
      }
    ).pipe(
      tap(result => {
        if (result.isSuccess) {
          this.instantNotificationsService.showNotification(
            OrdersInstantNotificationType.OrderUpdated,
            'success',
            `Заявка изменена`,
            `Заявка успешно изменена, её номер на бирже: \n ${result.orderNumber}`
          );
        }
      })
    );
  }

  private submitRequest(
    portfolio: string,
    method: 'post' | 'put',
    prepareOrderRequest: () => { url: string, body: any },
    onError: (error: Error | HttpErrorResponse) => void
  ): Observable<SubmitOrderResult> {
    const orderRequest = prepareOrderRequest();
    const body = {
      ...orderRequest.body,
      user: {
        portfolio: portfolio
      }
    };
    const options = {
      headers: {
        'X-ALOR-REQID': GuidGenerator.newGuid(),
        'X-ALOR-ORIGINATOR': 'astras'
      }
    };

    const requestPipe = method === 'post'
      ? this.httpService.post<SubmitOrderResponse>(orderRequest.url, body, options)
      : this.httpService.put<SubmitOrderResponse>(orderRequest.url, body, options);

    return requestPipe.pipe(
      catchError(err => {
        onError(err);
        return of(null);
      }),
      map(response => ({
        isSuccess: !!response?.orderNumber,
        orderNumber: response?.orderNumber
      } as SubmitOrderResult)),
      take(1)
    );
  }

  private handleCommandError(notificationType: OrdersInstantNotificationType, error: HttpErrorResponse, errorTitle: string) {
    const errorMessage = !!error.error.code && !!error.error.message
      ? `Ошибка ${error.error.code} <br/> ${error.error.message}`
      : error.message;

    this.instantNotificationsService.showNotification(
      notificationType,
      'error',
      errorTitle,
      this.prepareErrorMessage(errorMessage)
    );
  }

  private prepareErrorMessage(message: string): string {
    const links = new RegExp(httpLinkRegexp, 'im').exec(message);
    if (!links?.length) {
      return message;
    }

    return links!.reduce((result, link) => result.replace(link, `<a href="${link}" target="_blank">${link}</a>`), message);
  }
}
