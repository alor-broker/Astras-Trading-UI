import {
  Injectable,
  OnDestroy
} from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse
} from "@angular/common/http";
import {
  BehaviorSubject,
  forkJoin,
  Observable,
  of,
  switchMap,
  take,
  tap
} from "rxjs";
import {
  catchError,
  filter,
  map
} from "rxjs/operators";
import {ErrorHandlerService} from "../handle-error/error-handler.service";
import {toUnixTimestampSeconds} from "../../utils/datetime";
import {GuidGenerator} from "../../utils/guid";
import {httpLinkRegexp} from "../../utils/regexps";
import {InstantNotificationsService} from '../instant-notifications.service';
import {OrdersInstantNotificationType} from '../../models/terminal-settings/terminal-settings.model';
import {OrdersGroupService} from "./orders-group.service";
import {OrderCancellerService} from "../order-canceller.service";
import { ExecutionPolicy, SubmitGroupResult } from "../../models/orders/orders-group.model";
import {
  NewLimitOrder,
  NewMarketOrder,
  NewStopLimitOrder,
  NewStopMarketOrder, SubmitOrderResponse, SubmitOrderResult
} from "../../models/orders/new-order.model";
import {LimitOrderEdit, StopLimitOrderEdit, StopMarketOrderEdit} from "../../models/orders/edit-order.model";
import { EnvironmentService } from "../environment.service";

export type NewLinkedOrder = (NewLimitOrder | NewStopLimitOrder | NewStopMarketOrder) & {
  type: 'Limit' | 'StopLimit' | 'Stop';
};

@Injectable({
  providedIn: 'root'
})
export class OrderService implements OnDestroy {
  private readonly baseApiUrl =this.environmentService.apiUrl + '/commandapi/warptrans/TRADE/v2/client/orders/actions';
  private readonly ordersDelayMSec$ = new BehaviorSubject<number | null>(null);

  constructor(
    private readonly environmentService: EnvironmentService,
    private readonly httpService: HttpClient,
    private readonly instantNotificationsService: InstantNotificationsService,
    private readonly errorHandlerService: ErrorHandlerService,
    private readonly ordersGroupService: OrdersGroupService,
    private readonly canceller: OrderCancellerService,
  ) {
  }

  ngOnDestroy(): void {
    this.ordersDelayMSec$.complete();
  }

  get lastOrderDelayMSec$(): Observable<number> {
    return this.ordersDelayMSec$.pipe(
      filter((x): x is number => x != null)
    );
  }

  submitMarketOrder(order: NewMarketOrder, portfolio: string): Observable<SubmitOrderResult> {
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

  submitLimitOrder(order: NewLimitOrder, portfolio: string): Observable<SubmitOrderResult> {
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

  submitStopMarketOrder(order: NewStopMarketOrder, portfolio: string): Observable<SubmitOrderResult> {
    return this.submitOrder(
      portfolio,
      () => ({
        url: `${this.baseApiUrl}/stop`,
        body: {
          ...order,
          stopEndUnixTime: this.prepareStopEndUnixTimeValue(order.stopEndUnixTime)
        }
      })
    );
  }

  submitStopLimitOrder(order: NewStopLimitOrder, portfolio: string): Observable<SubmitOrderResult> {
    return this.submitOrder(
      portfolio,
      () => ({
        url: `${this.baseApiUrl}/stopLimit`,
        body: {
          ...order,
          stopEndUnixTime: this.prepareStopEndUnixTimeValue(order.stopEndUnixTime)
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
          stopEndUnixTime: this.prepareStopEndUnixTimeValue(orderEdit.stopEndUnixTime),
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
          stopEndUnixTime: this.prepareStopEndUnixTimeValue(orderEdit.stopEndUnixTime),
        }
      })
    );
  }

  submitOrdersGroup(
    orders: NewLinkedOrder[],
    portfolio: string,
    executionPolicy: ExecutionPolicy
  ): Observable<SubmitGroupResult | null> {

    return forkJoin(orders.map(o => {
      switch (o.type) {
        case 'Limit':
          return this.submitLimitOrder(o as NewLimitOrder, portfolio);
        case 'Stop':
          return this.submitStopMarketOrder(o as NewStopMarketOrder, portfolio);
        case 'StopLimit':
          return this.submitStopLimitOrder(o as NewStopLimitOrder, portfolio);
        default:
          return this.submitLimitOrder(o as NewLimitOrder, portfolio);
      }
    }))
      .pipe(
        switchMap(ordersRes => {
          if (!ordersRes.length) {
            return of(null);
          }

          const orderIds = ordersRes
            .filter(or => or.orderNumber != null)
            .map(or => or.orderNumber!);


          if (orderIds.length !== orders.length) {
            return forkJoin(ordersRes.map((ord, i) => ord.orderNumber != null
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
                map(() => null)
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

  private prepareStopEndUnixTimeValue(stopEndUnixTime?: Date): number | null {
    if (!stopEndUnixTime) {
      return 0;
    }

    return toUnixTimestampSeconds(stopEndUnixTime);
  }

  private submitOrder(portfolio: string, prepareOrderRequest: () => {
    url: string;
    body: any;
  }): Observable<SubmitOrderResult> {
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

  private submitOrderEdit(portfolio: string, prepareOrderRequest: () => {
    url: string;
    body: any;
  }): Observable<SubmitOrderResult> {
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
    prepareOrderRequest: () => { url: string, body: { [propName: string]: any } },
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

    let startTime: number;
    return of(Date.now()).pipe(
      tap(st => startTime = st),
      switchMap(() => requestPipe),
      catchError(err => {
        onError(err);
        return of(null);
      }),
      map(response => ({
        isSuccess: response?.orderNumber != null,
        orderNumber: response?.orderNumber
      } as SubmitOrderResult)),
      take(1),
      tap(() => {
        this.ordersDelayMSec$.next(Date.now() - startTime);
      })
    );
  }

  private handleCommandError(notificationType: OrdersInstantNotificationType, error: HttpErrorResponse, errorTitle: string): void {
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
    if (links == null || !links.length) {
      return message;
    }

    return links!.reduce((result, link) => result.replace(link, `<a href="${link}" target="_blank">${link}</a>`), message);
  }
}
