import { Injectable, inject } from '@angular/core';
import {
  ORDER_COMMAND_SERVICE_TOKEN,
  OrderCommandService
} from "../../../shared/services/orders/order-command.service";
import { OrderType } from 'src/app/shared/models/orders/order.model';
import {
  combineLatest,
  map,
  Observable,
  of,
  switchMap,
  take
} from "rxjs";
import {
  NewLimitOrder,
  NewLinkedOrder,
  NewMarketOrder,
  NewStopLimitOrder,
  NewStopMarketOrder,
  OrderCommandResult
} from "../../../shared/models/orders/new-order.model";
import { OrdersConfig } from "../../../shared/models/orders/orders-config.model";
import {
  LimitOrderEdit,
  StopLimitOrderEdit,
  StopMarketOrderEdit
} from "../../../shared/models/orders/edit-order.model";
import {
  ExecutionPolicy,
  SubmitGroupResult
} from "../../../shared/models/orders/orders-group.model";
import {
  USER_CONTEXT,
  UserContext
} from "../../../shared/services/auth/user-context";
import { Role } from "../../../shared/models/user/user.model";
import {
  TranslatorFn,
  TranslatorService
} from "../../../shared/services/translator.service";
import { NzModalService } from "ng-zorro-antd/modal";
import { HttpClient } from '@angular/common/http';
import { EnvironmentService } from "../../../shared/services/environment.service";
import { catchHttpError } from "../../../shared/utils/observable-helper";

export interface TargetPortfolio {
  portfolio: string;
  exchange: string;
}

interface PortfolioRisk {
  portfolio: string;
  exchange: string;
  portfolioEvaluation: number;
  portfolioLiquidationValue: number;
  initialMargin: number;
  minimalMargin: number;
  correctedMargin: number;
  riskCoverageRatioOne: number;
  riskCoverageRatioTwo: number;
  riskCategoryId: number;
  clientType: string;
  hasForbiddenPositions: boolean;
  hasNegativeQuantity: boolean;
}

@Injectable()
export class ConfirmableOrderCommandsService {
  private readonly orderCommandService = inject<OrderCommandService>(ORDER_COMMAND_SERVICE_TOKEN);
  private readonly userContext = inject<UserContext>(USER_CONTEXT);
  private readonly translatorService = inject(TranslatorService);
  private readonly nzModalService = inject(NzModalService);
  private readonly httpClient = inject(HttpClient);
  private readonly environmentService = inject(EnvironmentService);

  private readonly baseUrl = `${this.environmentService.apiUrl}/md/v2/Clients`;

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
    if (this.environmentService.features.lowClientRiskCheck ?? false) {
      return combineLatest({
        translator: this.translatorService.getTranslator('order-commands'),
        translatorCommon: this.translatorService.getTranslator(''),
        user: this.userContext.getUser(),
      }).pipe(
        take(1),
        switchMap(x => {
          if (x.user.roles == null || x.user.roles.includes(Role.Client)) {
            return this.shouldShowNotification(targetPortfolio).pipe(
              switchMap(shouldShowNotification => {
                if (shouldShowNotification ?? true) {
                  return new Observable<boolean | null>(subscriber => {
                    this.showConfirmation(
                      x.translator,
                      x.translatorCommon,
                      () => subscriber.next(true),
                      () => subscriber.complete()
                    );
                  });
                }

                return of(null);
              })
            );
          }

          return of(null);
        }),
        switchMap(x => {
          return onConfirmAction(x);
        })
      );
    }

    return onConfirmAction(null);
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

  private shouldShowNotification(targetPortfolio: TargetPortfolio): Observable<boolean | null> {
    return this.httpClient.get<PortfolioRisk>(
      `${this.baseUrl}/${targetPortfolio.exchange}/${targetPortfolio.portfolio}/risk`,
      {
        params: {
          format: 'simple'
        }
      }
    ).pipe(
      catchHttpError<PortfolioRisk | null>(null),
      map(r => {
        if (r == null) {
          return null;
        }

        return r.clientType === 'LowRisk' && r.riskCategoryId !== 100;
      }),
      take(1)
    );
  }
}
