import {Inject, Injectable} from '@angular/core';
import {ORDER_COMMAND_SERVICE_TOKEN, OrderCommandService} from "../../../shared/services/orders/order-command.service";
import {OrderType} from 'src/app/shared/models/orders/order.model';
import {combineLatest, Observable, of, switchMap, take} from "rxjs";
import {
  NewLimitOrder,
  NewLinkedOrder,
  NewMarketOrder,
  NewStopLimitOrder,
  NewStopMarketOrder,
  OrderCommandResult
} from "../../../shared/models/orders/new-order.model";
import {OrdersConfig} from "../../../shared/models/orders/orders-config.model";
import {LimitOrderEdit, StopLimitOrderEdit, StopMarketOrderEdit} from "../../../shared/models/orders/edit-order.model";
import {ExecutionPolicy, SubmitGroupResult} from "../../../shared/models/orders/orders-group.model";
import {USER_CONTEXT, UserContext} from "../../../shared/services/auth/user-context";
import {Role} from "../../../shared/models/user/user.model";
import {TranslatorFn, TranslatorService} from "../../../shared/services/translator.service";
import {NzModalService} from "ng-zorro-antd/modal";

@Injectable()
export class ConfirmableOrderCommandsService implements OrderCommandService {
  constructor(
    @Inject(ORDER_COMMAND_SERVICE_TOKEN)
    private readonly orderCommandService: OrderCommandService,
    @Inject(USER_CONTEXT)
    private readonly userContext: UserContext,
    private readonly translatorService: TranslatorService,
    private readonly nzModalService: NzModalService
  ) {
  }

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

  submitLimitOrder(order: NewLimitOrder, portfolio: string): Observable<OrderCommandResult> {
    return this.toConfirmable(isConfirmed => {
      order.allowMargin = isConfirmed;
      return this.orderCommandService.submitLimitOrder(order, portfolio);
    });
  }

  submitLimitOrderEdit(orderEdit: LimitOrderEdit, portfolio: string): Observable<OrderCommandResult> {
    return this.orderCommandService.submitLimitOrderEdit(orderEdit, portfolio);
  }

  submitMarketOrder(order: NewMarketOrder, portfolio: string): Observable<OrderCommandResult> {
    return this.toConfirmable(isConfirmed => {
      order.allowMargin = isConfirmed;
      return this.orderCommandService.submitMarketOrder(order, portfolio);
    });
  }

  submitOrdersGroup(orders: NewLinkedOrder[], portfolio: string, executionPolicy: ExecutionPolicy): Observable<SubmitGroupResult | null> {
    return this.toConfirmable(isConfirmed => {
      orders.forEach(order => order.allowMargin = isConfirmed);
      return this.orderCommandService.submitOrdersGroup(orders, portfolio, executionPolicy);
    });
  }

  submitStopLimitOrder(order: NewStopLimitOrder, portfolio: string): Observable<OrderCommandResult> {
    return this.toConfirmable(isConfirmed => {
      order.allowMargin = isConfirmed;
      return this.orderCommandService.submitStopLimitOrder(order, portfolio);
    });
  }

  submitStopLimitOrderEdit(orderEdit: StopLimitOrderEdit, portfolio: string): Observable<OrderCommandResult> {
    return this.orderCommandService.submitStopLimitOrderEdit(orderEdit, portfolio);
  }

  submitStopMarketOrder(order: NewStopMarketOrder, portfolio: string): Observable<OrderCommandResult> {
    return this.toConfirmable(isConfirmed => {
      order.allowMargin = isConfirmed;
      return this.orderCommandService.submitStopMarketOrder(order, portfolio);
    });
  }

  submitStopMarketOrderEdit(orderEdit: StopMarketOrderEdit, portfolio: string): Observable<OrderCommandResult> {
    return this.orderCommandService.submitStopMarketOrderEdit(orderEdit, portfolio);
  }

  private toConfirmable<TR>(onConfirmAction: (isConfirmed: boolean) => Observable<TR>): Observable<TR> {
    return combineLatest({
      translator: this.translatorService.getTranslator('order-commands'),
      translatorCommon: this.translatorService.getTranslator(''),
      user: this.userContext.getUser()
    }).pipe(
      take(1),
      switchMap(x => {
        if (x.user.roles == null || x.user.roles.includes(Role.Client)) {
          return new Observable(subscriber => {
            this.showConfirmation(
              x.translator,
              x.translatorCommon,
              () => subscriber.next({}),
              () => subscriber.complete()
            );
          });
        }

        return of({});
      }),
      switchMap(() => {
        return onConfirmAction(true);
      })
    );
  }

  private showConfirmation(
    translator: TranslatorFn,
    translatorCommon: TranslatorFn,
    onConfirmAction: () => void,
    onRejectAction: () => void,
  ): void {
    this.nzModalService.confirm({
      nzTitle: translator(['marginOrderConfirmationTitle']),
      nzContent: translator(['marginOrderConfirmationContent']),
      nzOkText: translatorCommon(['yes']),
      nzCancelText: translatorCommon(['no']),
      nzIconType: 'exclamation-circle',
      nzOnOk: () => onConfirmAction(),
      nzOnCancel: () => onRejectAction(),
    });
  }
}
