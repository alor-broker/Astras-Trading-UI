import {
  inject,
  Injectable
} from '@angular/core';
import {
  Observable,
  switchMap
} from "rxjs";
import {
  MarginOrderConfirmationService,
  TargetPortfolio
} from './margin-order-notification.service';
import {
  ORDER_COMMAND_SERVICE_TOKEN,
  OrdersConfig
} from '../types/order-command-service.types';
import {OrderType} from '../types/orders.types';
import {
  NewLimitOrder,
  NewLinkedOrder,
  NewMarketOrder,
  NewStopLimitOrder,
  NewStopMarketOrder,
  OrderCommandResult
} from '../types/new-order.types';
import {
  LimitOrderEdit,
  StopLimitOrderEdit,
  StopMarketOrderEdit
} from '../types/edit-order.types';
import {
  ExecutionPolicy,
  SubmitGroupResult
} from '../types/order-group.types';

@Injectable()
export class ConfirmableOrderCommandsService {
  private readonly orderCommandService = inject(ORDER_COMMAND_SERVICE_TOKEN);

  private readonly marginOrderConfirmationService = inject(MarginOrderConfirmationService);

  cancelOrders(cancelRequests: {
    orderId: string;
    portfolio: string;
    exchange: string;
    orderType: OrderType;
  }[]): Observable<OrderCommandResult[]> {
    return this.orderCommandService.cancelOrders(cancelRequests);
  }

  getOrdersConfig(): OrdersConfig {
    return this.orderCommandService.getOrdersConfig();
  }

  submitLimitOrder(order: NewLimitOrder, targetPortfolio: TargetPortfolio): Observable<OrderCommandResult> {
    return this.toConfirmable(
      targetPortfolio,
      isConfirmed => {
        order.allowMargin = isConfirmed ?? undefined;
        return this.orderCommandService.submitLimitOrder(order, targetPortfolio.portfolio);
      }
    );
  }

  submitLimitOrderEdit(orderEdit: LimitOrderEdit, targetPortfolio: TargetPortfolio): Observable<OrderCommandResult> {
    return this.toConfirmable(
      targetPortfolio,
      isConfirmed => {
        orderEdit.allowMargin = isConfirmed ?? undefined;
        return this.orderCommandService.submitLimitOrderEdit(orderEdit, targetPortfolio.portfolio);
      }
    );
  }

  submitMarketOrder(order: NewMarketOrder, targetPortfolio: TargetPortfolio): Observable<OrderCommandResult> {
    return this.toConfirmable(
      targetPortfolio,
      isConfirmed => {
        order.allowMargin = isConfirmed ?? undefined;
        return this.orderCommandService.submitMarketOrder(order, targetPortfolio.portfolio);
      });
  }

  submitOrdersGroup(orders: NewLinkedOrder[], targetPortfolio: TargetPortfolio, executionPolicy: ExecutionPolicy): Observable<SubmitGroupResult | null> {
    return this.toConfirmable(
      targetPortfolio,
      isConfirmed => {
        orders.forEach(order => order.allowMargin = isConfirmed ?? undefined);
        return this.orderCommandService.submitOrdersGroup(orders, targetPortfolio.portfolio, executionPolicy);
      });
  }

  submitStopLimitOrder(order: NewStopLimitOrder, targetPortfolio: TargetPortfolio): Observable<OrderCommandResult> {
    return this.toConfirmable(
      targetPortfolio,
      isConfirmed => {
        order.allowMargin = isConfirmed ?? undefined;
        return this.orderCommandService.submitStopLimitOrder(order, targetPortfolio.portfolio);
      });
  }

  submitStopLimitOrderEdit(orderEdit: StopLimitOrderEdit, targetPortfolio: TargetPortfolio): Observable<OrderCommandResult> {
    return this.toConfirmable(
      targetPortfolio,
      isConfirmed => {
        orderEdit.allowMargin = isConfirmed ?? undefined;
        return this.orderCommandService.submitStopLimitOrderEdit(orderEdit, targetPortfolio.portfolio);
      }
    );
  }

  submitStopMarketOrder(order: NewStopMarketOrder, targetPortfolio: TargetPortfolio): Observable<OrderCommandResult> {
    return this.toConfirmable(
      targetPortfolio,
      isConfirmed => {
        order.allowMargin = isConfirmed ?? undefined;
        return this.orderCommandService.submitStopMarketOrder(order, targetPortfolio.portfolio);
      });
  }

  submitStopMarketOrderEdit(orderEdit: StopMarketOrderEdit, targetPortfolio: TargetPortfolio): Observable<OrderCommandResult> {
    return this.toConfirmable(
      targetPortfolio,
      isConfirmed => {
        orderEdit.allowMargin = isConfirmed ?? undefined;
        return this.orderCommandService.submitStopMarketOrderEdit(orderEdit, targetPortfolio.portfolio);
      }
    );
  }

  private toConfirmable<TR>(
    targetPortfolio: TargetPortfolio,
    onConfirmAction: (isConfirmed: boolean | null) => Observable<TR>
  ): Observable<TR> {
    return this.marginOrderConfirmationService.checkWithConfirmation(targetPortfolio).pipe(
      switchMap(confirmed => onConfirmAction(confirmed))
    );
  }
}
