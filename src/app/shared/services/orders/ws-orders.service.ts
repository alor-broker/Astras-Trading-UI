import { Injectable } from '@angular/core';
import {
  NewLimitOrder,
  NewMarketOrder,
  NewOrderBase,
  NewStopLimitOrder,
  NewStopMarketOrder,
  OrderCommandResult
} from "../../models/orders/new-order.model";
import {
  forkJoin,
  Observable,
  switchMap,
  take
} from "rxjs";
import {
  LimitOrderEdit,
  StopLimitOrderEdit,
  StopMarketOrderEdit
} from "../../models/orders/edit-order.model";
import {
  CommandRequest,
  CommandResponse,
  WsOrdersConnector
} from "./ws-orders-connector";
import {
  map,
  tap
} from "rxjs/operators";
import { InstrumentsService } from "../../../modules/instruments/services/instruments.service";
import { OrderInstantTranslatableNotificationsService } from "./order-instant-translatable-notifications.service";
import { OptionalProperty } from "../../utils/types";
import { toUnixTimestampSeconds } from "../../utils/datetime";
import { TradingStatus } from "../../models/instruments/instrument.model";
import {
  OrderType,
  TimeInForce
} from "../../models/orders/order.model";
import { InstrumentKey } from "../../models/instruments/instrument-key.model";

@Injectable({
  providedIn: 'root'
})
export class WsOrdersService {
  constructor(
    private readonly ordersConnector: WsOrdersConnector,
    private readonly instrumentsService: InstrumentsService,
    private readonly instantNotificationsService: OrderInstantTranslatableNotificationsService,
  ) {
    ordersConnector.warmUp();
  }

  submitMarketOrder(order: NewMarketOrder, portfolio: string): Observable<OrderCommandResult> {
    return this.instrumentsService.getInstrument(order.instrument)
      .pipe(
        take(1),
        switchMap(instrument => {
          const additionalParams = {} as { [paramName: string]: any };

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

  private prepareOrderCreateCommand<T extends NewOrderBase>(
    type: OrderType,
    baseRequest: T,
    portfolio: string
  ): CommandRequest {
    const clone: OptionalProperty<T, 'instrument'> = {
      ...baseRequest,
    };

    delete clone.instrument;

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
      }
    };
  }

  private prepareOrderUpdateCommand<T extends { instrument: InstrumentKey }>(
    type: OrderType.Limit | OrderType.StopMarket | OrderType.StopLimit,
    baseRequest: T,
    portfolio: string
  ): CommandRequest {
    const clone: OptionalProperty<T, 'instrument'> = {
      ...baseRequest,
    };

    delete clone.instrument;

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
}
