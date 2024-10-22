import { Injectable } from '@angular/core';
import { OrderCommandService } from "../../../shared/services/orders/order-command.service";
import {
  forkJoin,
  Observable,
  of,
  switchMap,
  take,
  tap
} from "rxjs";
import {
  NewLimitOrder,
  OrderCommandResult
} from "../../../shared/models/orders/new-order.model";
import { OrderType } from "../../../shared/models/orders/order.model";
import { OrderInstantTranslatableNotificationsService } from "../../../shared/services/orders/order-instant-translatable-notifications.service";
import {
  HttpClient,
  HttpErrorResponse
} from "@angular/common/http";
import { EnvironmentService } from "../../../shared/services/environment.service";
import { GuidGenerator } from "../../../shared/utils/guid";
import {
  catchError,
  map
} from "rxjs/operators";
import { ErrorHandlerService } from "../../../shared/services/handle-error/error-handler.service";
import { catchHttpError } from "../../../shared/utils/observable-helper";
import { LimitOrderEdit } from "../../../shared/models/orders/edit-order.model";
import { SubmitGroupResult } from "../../../shared/models/orders/orders-group.model";
import { OrdersConfig } from "../../../shared/models/orders/orders-config.model";

export interface OrderCommandResponse {
  message: string;
  orderNumber?: string;
  code?: string;
}

@Injectable()
export class AdminOrderCommandService implements OrderCommandService {
  private readonly baseApiUrl = this.environmentService.apiUrl + '/commandapi/api/v2/admin/orders';

  constructor(
    private readonly environmentService: EnvironmentService,
    private readonly httpClient: HttpClient,
    private readonly errorHandlerService: ErrorHandlerService,
    private readonly instantNotificationsService: OrderInstantTranslatableNotificationsService,
  ) {
  }

  cancelOrders(cancelRequests: {
    orderId: string;
    portfolio: string;
    exchange: string;
    orderType: OrderType;
  }[]): Observable<OrderCommandResult[]> {
    const requests = cancelRequests.map(r => {
      let stream$: Observable<OrderCommandResult>;

      if (r.orderType !== OrderType.Limit) {
        stream$ = of({
          isSuccess: false,
          message: `Order type ${r.orderType} is not supported`
        } as OrderCommandResult);
      } else {
        stream$ = this.httpClient.request<OrderCommandResult>(
          'DELETE',
          `${this.baseApiUrl}/${r.orderId}`,
          {
            body: {
              user: {
                portfolio: r.portfolio
              },
              exchange: r.exchange
            },
            headers: {
              'X-ALOR-REQID': GuidGenerator.newGuid()
            }
          }
        ).pipe(
          catchHttpError<OrderCommandResult>(
            (err: HttpErrorResponse) => {
              return {
                isSuccess: false,
                message: err.message
              };
            }
            , this.errorHandlerService),
          take(1)
        );
      }

      return stream$.pipe(
        tap(result => {
          if (result != null && result.isSuccess) {
            setTimeout(() => this.instantNotificationsService.orderCancelled(result.orderNumber!, r.exchange));
          } else {
            setTimeout(() => this.instantNotificationsService.orderCancelFailed(
                result ?? {
                  isSuccess: false,
                  message: ''
                })
            );
          }
        })
      );
    });

    return forkJoin(requests);
  }

  submitLimitOrder(order: NewLimitOrder, portfolio: string): Observable<OrderCommandResult> {
    return this.submitOrder(
      portfolio,
      () => ({
        url: `${this.baseApiUrl}/actions/limit`,
        body: {
          ...order,
          comment: order.meta != null
            ? JSON.stringify({ meta: order.meta })
            : undefined
        }
      })
    );
  }

  submitLimitOrderEdit(orderEdit: LimitOrderEdit, portfolio: string): Observable<OrderCommandResult> {
    return this.submitOrderEdit(
      portfolio,
      () => ({
        url: `${this.baseApiUrl}/actions/limit/${orderEdit.orderId}`,
        body: {
          ...orderEdit
        }
      })
    );
  }

  submitMarketOrder(): Observable<OrderCommandResult> {
    return this.createSubmitStreamWithUnsupportedError(OrderType.Market);
  }

  submitOrdersGroup(): Observable<SubmitGroupResult | null> {
    return of(null);
  }

  submitStopLimitOrder(): Observable<OrderCommandResult> {
    return this.createSubmitStreamWithUnsupportedError(OrderType.StopLimit);
  }

  submitStopLimitOrderEdit(): Observable<OrderCommandResult> {
    return this.createEditStreamWithUnsupportedError(OrderType.StopLimit);
  }

  submitStopMarketOrder(): Observable<OrderCommandResult> {
    return this.createSubmitStreamWithUnsupportedError(OrderType.StopMarket);
  }

  submitStopMarketOrderEdit(): Observable<OrderCommandResult> {
    return this.createEditStreamWithUnsupportedError(OrderType.StopMarket);
  }

  getOrdersConfig(): OrdersConfig {
    return {
      limitOrder: {
        isSupported: true,
        orderConfig: {
          isBracketsSupported: false
        }
      },
      marketOrder: {
        isSupported: false
      },
      stopOrder: {
        isSupported: false
      }
    };
  }

  private createSubmitStreamWithUnsupportedError(orderType: OrderType): Observable<OrderCommandResult> {
    return of({
      isSuccess: false,
      message: `Order type ${orderType} is not supported`
    }).pipe(
      tap(x => {
        this.instantNotificationsService.orderSubmitFailed(x);
      })
    );
  }

  private createEditStreamWithUnsupportedError(orderType: OrderType): Observable<OrderCommandResult> {
    return of({
      isSuccess: false,
      message: `Order type ${orderType} is not supported`
    }).pipe(
      tap(x => {
        this.instantNotificationsService.orderUpdateFailed(x);
      })
    );
  }

  private submitOrder(portfolio: string, prepareOrderRequest: () => {
    url: string;
    body: any;
  }): Observable<OrderCommandResult> {
    return this.submitRequest(
      portfolio,
      'post',
      prepareOrderRequest,
      error => {
        if (!(error instanceof HttpErrorResponse)) {
          this.errorHandlerService.handleError(error);
          return error.message;
        } else {
          const errorMessage = this.getErrorMessage(error);
          this.instantNotificationsService.orderSubmitFailed({
            isSuccess: false,
            message: errorMessage
          });

          return errorMessage;
        }
      }
    )
      .pipe(
        tap(result => {
          if (result.isSuccess) {
            this.instantNotificationsService.orderCreated(result.orderNumber!);
          }
        })
      );
  }

  private submitOrderEdit(portfolio: string, prepareOrderRequest: () => {
    url: string;
    body: any;
  }): Observable<OrderCommandResult> {
    return this.submitRequest(
      portfolio,
      'put',
      prepareOrderRequest,
      error => {
        if (!(error instanceof HttpErrorResponse)) {
          this.errorHandlerService.handleError(error);
          return error.message;
        } else {
          const errorMessage = this.getErrorMessage(error);
          this.instantNotificationsService.orderUpdateFailed({
            isSuccess: false,
            message: errorMessage
          });

          return errorMessage;
        }
      }
    )
      .pipe(
        tap(result => {
          if (result.isSuccess) {
            this.instantNotificationsService.orderUpdated(result.orderNumber!);
          }
        }),
      );
  }

  private submitRequest(
    portfolio: string,
    method: 'post' | 'put',
    prepareOrderRequest: () => { url: string, body: Record<string, any> },
    onError: (error: Error | HttpErrorResponse) => string
  ): Observable<OrderCommandResult> {
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
      ? this.httpClient.post<OrderCommandResponse>(orderRequest.url, body, options)
      : this.httpClient.put<OrderCommandResponse>(orderRequest.url, body, options);

    return of(Date.now()).pipe(
      switchMap(() => requestPipe),
      catchError(err => {
        const errorMessage = onError(err);
        return of({
          orderNumber: null,
          message: errorMessage
        });
      }),
      map(response => ({
        isSuccess: response?.orderNumber != null,
        orderNumber: response?.orderNumber,
        message: response?.orderNumber != null ? 'Success' : response.message
      } as OrderCommandResult)),
      take(1)
    );
  }

  private getErrorMessage(error: HttpErrorResponse): string {
    return error.error?.code != null && error.error?.message != null
      ? `${error.error.code} <br/> ${error.error.message}`
      : error.message;
  }
}
