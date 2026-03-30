import {
  CommandRequest,
  CommandResponse,
  WsOrdersConnector
} from "./ws-orders-connector";
import { InstrumentsService } from "../../../modules/instruments/services/instruments.service";
import { OrderInstantTranslatableNotificationsService } from "../../../shared/services/orders/order-instant-translatable-notifications.service";
import {
  NewLimitOrder,
  NewLinkedOrder,
  NewMarketOrder,
  NewOrderBase,
  NewStopLimitOrder,
  NewStopMarketOrder,
  OrderCommandResult
} from "../../../shared/models/orders/new-order.model";
import {
  forkJoin,
  Observable,
  of,
  switchMap,
  take,
  tap
} from "rxjs";
import {
  OrderType,
  TimeInForce
} from "../../../shared/models/orders/order.model";
import {
  LimitOrderEdit,
  StopLimitOrderEdit,
  StopMarketOrderEdit
} from "../../../shared/models/orders/edit-order.model";
import { TradingStatus } from "../../../shared/models/instruments/instrument.model";
import { map } from "rxjs/operators";
import { OptionalProperty } from "../../../shared/utils/types";
import { InstrumentKey } from "../../../shared/models/instruments/instrument-key.model";
import { toUnixTimestampSeconds } from "../../../shared/utils/datetime";
import { Injectable, inject } from "@angular/core";
import { OrderCommandService } from "../../../shared/services/orders/order-command.service";
import {
  CreateOrderGroupReq,
  ExecutionPolicy,
  GroupCreatedEventKey,
  SubmitGroupResult
} from "../../../shared/models/orders/orders-group.model";
import { catchHttpError } from "../../../shared/utils/observable-helper";
import { HttpClient } from "@angular/common/http";
import { EnvironmentService } from "../../../shared/services/environment.service";
import { ErrorHandlerService } from "../../../shared/services/handle-error/error-handler.service";
import { EventBusService } from "../../../shared/services/event-bus.service";
import { OrdersConfig } from "../../../shared/models/orders/orders-config.model";

interface GroupItem {
  result: OrderCommandResult;
  sourceOrder: NewLinkedOrder;
}

@Injectable()
export class ClientOrderCommandService implements OrderCommandService {
  private readonly ordersConnector = inject(WsOrdersConnector);
  private readonly instrumentsService = inject(InstrumentsService);
  private readonly instantNotificationsService = inject(OrderInstantTranslatableNotificationsService);
  private readonly httpClient = inject(HttpClient);
  private readonly environmentService = inject(EnvironmentService);
  private readonly errorHandlerService = inject(ErrorHandlerService);
  private readonly eventBusService = inject(EventBusService);

  constructor() {
    const ordersConnector = this.ordersConnector;

    ordersConnector.warmUp();
  }

  submitMarketOrder(order: NewMarketOrder, portfolio: string): Observable<OrderCommandResult> {
    return this.instrumentsService.getInstrument(order.instrument)
      .pipe(
        take(1),
        switchMap(instrument => {
          const additionalParams = {} as Record<string, any>;

          if (
            instrument?.tradingStatus === TradingStatus.ClosingAuction ||
            instrument?.tradingStatus === TradingStatus.OpeningAuction
          ) {
            additionalParams.timeInForce = TimeInForce.OneDay;
          }

          return this.submitCreateOrderCommand(this.prepareOrderCreateCommand(
            OrderType.Market,
            {
              ...order,
              ...additionalParams
            },
            portfolio
          ));
        })
      );
  }

  submitLimitOrder(order: NewLimitOrder, portfolio: string): Observable<OrderCommandResult> {
    return this.submitCreateOrderCommand(this.prepareOrderCreateCommand(
      OrderType.Limit,
      order,
      portfolio
    ));
  }

  submitStopMarketOrder(order: NewStopMarketOrder, portfolio: string): Observable<OrderCommandResult> {
    return this.submitCreateOrderCommand(this.prepareOrderCreateCommand(
      OrderType.StopMarket,
      {
        ...order,
        stopEndUnixTime: this.prepareStopEndUnixTimeValue(order.stopEndUnixTime)
      },
      portfolio
    ));
  }

  submitStopLimitOrder(order: NewStopLimitOrder, portfolio: string): Observable<OrderCommandResult> {
    return this.submitCreateOrderCommand(this.prepareOrderCreateCommand(
      OrderType.StopLimit,
      {
        ...order,
        stopEndUnixTime: this.prepareStopEndUnixTimeValue(order.stopEndUnixTime)
      },
      portfolio
    ));
  }

  submitLimitOrderEdit(orderEdit: LimitOrderEdit, portfolio: string): Observable<OrderCommandResult> {
    return this.submitEditOrderCommand(this.prepareOrderUpdateCommand(
      OrderType.Limit,
      orderEdit,
      portfolio
    ));
  }

  submitStopMarketOrderEdit(orderEdit: StopMarketOrderEdit, portfolio: string): Observable<OrderCommandResult> {
    return this.submitEditOrderCommand(this.prepareOrderUpdateCommand(
      OrderType.StopMarket,
      {
        ...orderEdit,
        stopEndUnixTime: this.prepareStopEndUnixTimeValue(orderEdit.stopEndUnixTime)
      },
      portfolio
    ));
  }

  submitStopLimitOrderEdit(orderEdit: StopLimitOrderEdit, portfolio: string): Observable<OrderCommandResult> {
    return this.submitEditOrderCommand(this.prepareOrderUpdateCommand(
      OrderType.StopLimit,
      {
        ...orderEdit,
        stopEndUnixTime: this.prepareStopEndUnixTimeValue(orderEdit.stopEndUnixTime)
      },
      portfolio
    ));
  }

  cancelOrders(cancelRequests: {
    orderId: string;
    portfolio: string;
    exchange: string;
    orderType: OrderType;
  }[]): Observable<OrderCommandResult[]> {
    const requests = cancelRequests.map(r => {
      return this.submitCommand({
        opcode: `delete:${r.orderType}`,
        orderId: r.orderId,
        exchange: r.exchange,
        user: {
          portfolio: r.portfolio
        }
      }).pipe(
        map(r => this.toOrderCommandResult(r)),
        tap(result => {
          if (result.isSuccess) {
            setTimeout(() => this.instantNotificationsService.orderCancelled(result.orderNumber!, r.exchange));
          } else {
            setTimeout(() => this.instantNotificationsService.orderCancelFailed(result));
          }
        })
      );
    });

    return forkJoin(requests);
  }

  submitOrdersGroup(orders: NewLinkedOrder[], portfolio: string, executionPolicy: ExecutionPolicy): Observable<SubmitGroupResult | null> {
    const items = this.prepareGroupItems(orders, portfolio);

    return forkJoin(items)
      .pipe(
        switchMap(ordersRes => {
          if (!ordersRes.length) {
            return of(null);
          }

          const failedOrders = ordersRes.filter(x => x.result.orderNumber == null);
          if (failedOrders.length > 0) {
            const cancelRequests = ordersRes.filter(x => x.result.orderNumber != null);
            if (cancelRequests.length == 0) {
              return of(null);
            }

            return this.rollbackItems(cancelRequests, portfolio);
          }

          return this.submitGroupRequest(ordersRes, portfolio, executionPolicy);
        })
      );
  }

  getOrdersConfig(): OrdersConfig {
    return {
      limitOrder: {
        isSupported: true,
        orderConfig: {
          isBracketsSupported: true,
          unsupportedFields: {
            reason: true
          }
        }
      },
      marketOrder: {
        isSupported: true,
        orderConfig: {
          unsupportedFields: {}
        }
      },
      stopOrder: {
        isSupported: true
      }
    };
  }

  private prepareOrderCreateCommand<T extends NewOrderBase>(
    type: OrderType,
    baseRequest: T,
    portfolio: string
  ): CommandRequest {
    const clone: OptionalProperty<T, 'instrument'> = {
      ...baseRequest,
    };

    delete clone.instrument;
    delete clone.meta;

    this.cleanUpRequest(clone);

    return {
      opcode: `create:${type}`,
      ...clone,
      instrument: {
        symbol: baseRequest.instrument.symbol,
        exchange: baseRequest.instrument.exchange
      },
      board: baseRequest.instrument.instrumentGroup,
      user: {
        portfolio
      },
      comment: baseRequest.meta != null
        ? JSON.stringify({ meta: baseRequest.meta })
        : undefined
    };
  }

  private prepareOrderUpdateCommand<T extends { instrument: InstrumentKey, allowMargin?: boolean }>(
    type: OrderType.Limit | OrderType.StopMarket | OrderType.StopLimit,
    baseRequest: T,
    portfolio: string
  ): CommandRequest {
    const clone: OptionalProperty<T, 'instrument'> = {
      ...baseRequest,
    };

    delete clone.instrument;

    this.cleanUpRequest(clone);

    return {
      opcode: `update:${type}`,
      ...clone,
      instrument: {
        symbol: baseRequest.instrument.symbol,
        exchange: baseRequest.instrument.exchange
      },
      board: baseRequest.instrument.instrumentGroup,
      user: {
        portfolio
      }
    };
  }

  private submitCreateOrderCommand<T extends CommandRequest>(request: T): Observable<OrderCommandResult> {
    return this.submitCommand(request).pipe(
      map(r => this.toOrderCommandResult(r)),
      tap(result => {
        if (result.isSuccess) {
          setTimeout(() => this.instantNotificationsService.orderCreated(result.orderNumber!));
        } else {
          setTimeout(() => this.instantNotificationsService.orderSubmitFailed(result));
        }
      })
    );
  }

  private toOrderCommandResult(commandResponse: CommandResponse): OrderCommandResult {
    return {
      isSuccess: commandResponse.httpCode === 200,
      message: commandResponse.message,
      orderNumber: commandResponse.orderNumber
    };
  }

  private submitEditOrderCommand<T extends CommandRequest>(request: T): Observable<OrderCommandResult> {
    return this.submitCommand(request).pipe(
      map(r => this.toOrderCommandResult(r)),
      tap(result => {
        if (result.isSuccess) {
          setTimeout(() => this.instantNotificationsService.orderUpdated(result.orderNumber!));
        } else {
          setTimeout(() => this.instantNotificationsService.orderUpdateFailed(result));
        }
      })
    );
  }

  private submitCommand<T extends CommandRequest>(request: T): Observable<CommandResponse> {
    return this.ordersConnector.submitCommand(request).pipe(
      take(1)
    );
  }

  private prepareStopEndUnixTimeValue(stopEndUnixTime?: Date): number | null {
    if (!stopEndUnixTime) {
      return 0;
    }

    return toUnixTimestampSeconds(stopEndUnixTime);
  }

  private prepareGroupItems(orders: NewLinkedOrder[], portfolio: string): Observable<GroupItem>[] {
    const toSubmitResult = (stream: Observable<OrderCommandResult>, sourceOrder: NewLinkedOrder): Observable<GroupItem> => {
      return stream.pipe(
        map(result => ({ result, sourceOrder }))
      );
    };

    return orders.map(o => {
      switch (o.type) {
        case OrderType.Limit:
          return toSubmitResult(this.submitLimitOrder(o as NewLimitOrder, portfolio), o);
        case OrderType.StopMarket:
          return toSubmitResult(this.submitStopMarketOrder(o as NewStopMarketOrder, portfolio), o);
        case OrderType.StopLimit:
          return toSubmitResult(this.submitStopLimitOrder(o as NewStopLimitOrder, portfolio), o);
        default:
          throw new Error(`Order type '${o.type}' is not supported`);
      }
    });
  }

  private rollbackItems(items: GroupItem[], portfolio: string): Observable<null> {
    const cancelRequests = items.map(x => ({
      orderId: x.result.orderNumber!,
      portfolio: portfolio,
      exchange: x.sourceOrder.instrument.exchange,
      orderType: x.sourceOrder.type
    }));

    return this.cancelOrders(cancelRequests).pipe(
      map(() => null)
    );
  }

  private submitGroupRequest(items: GroupItem[], portfolio: string, executionPolicy: ExecutionPolicy): Observable<SubmitGroupResult | null> {
    return this.httpClient.post<SubmitGroupResult>(
      `${this.environmentService.apiUrl}/commandapi/api/orderGroups`,
      {
        orders: items.map(i => ({
          orderId: i.result.orderNumber,
          exchange: i.sourceOrder.instrument.exchange,
          portfolio: portfolio,
          type: this.toApiOrderType(i.sourceOrder.type)
        })),
        executionPolicy
      } as CreateOrderGroupReq
    ).pipe(
      catchHttpError<SubmitGroupResult | null>(null, this.errorHandlerService),
      tap(res => {
        if (res != null && res.message === 'success') {
          this.eventBusService.publish({ key: GroupCreatedEventKey });
          setTimeout(() => this.instantNotificationsService.ordersGroupCreated(items.map(o => o.result.orderNumber).join(', ')));
        } else {
          this.rollbackItems(items, portfolio).pipe(
            take(1)
          ).subscribe();
        }
      }),
      take(1)
    );
  }

  private toApiOrderType(type: OrderType): string {
    switch (type) {
      case OrderType.Market:
        return 'Market';
      case OrderType.Limit:
        return 'Limit';
      case OrderType.StopMarket:
        return 'Stop';
      case OrderType.StopLimit:
        return 'StopLimit';
      default:
        throw new Error(`Unsupported order type ${type}`);
    }
  }

  private cleanUpRequest<T extends { allowMargin?: boolean }>(request: T): T {
    if(request.allowMargin == null) {
      delete request.allowMargin;
    }

    return request;
  }
}
