import {
  Injectable,
  OnDestroy
} from '@angular/core';
import { catchHttpError } from "../../utils/observable-helper";
import { HttpClient } from "@angular/common/http";
import { ErrorHandlerService } from "../handle-error/error-handler.service";
import {
  BehaviorSubject,
  forkJoin,
  Observable,
  of,
  shareReplay,
  switchMap,
  take,
  tap
} from "rxjs";
import {
  CreateOrderGroupReq,
  ExecutionPolicy,
  OrdersGroup,
  SubmitGroupResult
} from "../../models/orders/orders-group.model";
import { EnvironmentService } from "../environment.service";
import {
  NewLimitOrder,
  NewLinkedOrder,
  NewStopLimitOrder,
  NewStopMarketOrder,
  OrderCommandResult
} from "../../models/orders/new-order.model";
import { map } from "rxjs/operators";
import { OrderType } from "../../models/orders/order.model";
import { WsOrdersService } from "./ws-orders.service";
import { OrderInstantTranslatableNotificationsService } from "./order-instant-translatable-notifications.service";

interface GroupItem {
  result: OrderCommandResult;
  sourceOrder: NewLinkedOrder;
}

@Injectable({
  providedIn: 'root'
})
export class OrdersGroupService implements OnDestroy {
  private readonly orderGroupsUrl = this.environmentService.apiUrl + '/commandapi/api/orderGroups';

  private readonly refresh$ = new BehaviorSubject(null);
  private orderGroups$?: Observable<OrdersGroup[]>;

  constructor(
    private readonly environmentService: EnvironmentService,
    private readonly http: HttpClient,
    private readonly errorHandlerService: ErrorHandlerService,
    private readonly wsOrdersService: WsOrdersService,
    private readonly instantNotificationsService: OrderInstantTranslatableNotificationsService,
  ) {
  }

  ngOnDestroy(): void {
    this.refresh$.complete();
  }

  submitOrdersGroup(
    orders: NewLinkedOrder[],
    portfolio: string,
    executionPolicy: ExecutionPolicy
  ): Observable<SubmitGroupResult | null> {
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

  getAllOrderGroups(): Observable<OrdersGroup[]> {
    if (!this.orderGroups$) {
      this.orderGroups$ = this.refresh$
        .pipe(
          switchMap(() => this.http.get<OrdersGroup[]>(`${this.orderGroupsUrl}`)),
          catchHttpError<OrdersGroup[]>([], this.errorHandlerService),
          shareReplay(1)
        );
    }

    this.refresh$.next(null);

    return this.orderGroups$;
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
          return toSubmitResult(this.wsOrdersService.submitLimitOrder(o as NewLimitOrder, portfolio), o);
        case OrderType.StopMarket:
          return toSubmitResult(this.wsOrdersService.submitStopMarketOrder(o as NewStopMarketOrder, portfolio), o);
        case OrderType.StopLimit:
          return toSubmitResult(this.wsOrdersService.submitStopLimitOrder(o as NewStopLimitOrder, portfolio), o);
        default:
          throw new Error(`Order type '${o.type}' is not supported`);
      }
    });
  }

  private submitGroupRequest(items: GroupItem[], portfolio: string, executionPolicy: ExecutionPolicy): Observable<SubmitGroupResult | null> {
    return this.http.post<SubmitGroupResult>(
      this.orderGroupsUrl,
      {
        orders: items.map(i => ({
          orderId: i.result.orderNumber,
          exchange: i.sourceOrder.instrument.exchange,
          portfolio: portfolio,
          type: i.sourceOrder.type
        })),
        executionPolicy
      } as CreateOrderGroupReq
    ).pipe(
      catchHttpError<SubmitGroupResult | null>(null, this.errorHandlerService),
      tap(res => {
        if (res != null && res.message === 'success') {
          this.refresh$.next(null);
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

  private rollbackItems(items: GroupItem[], portfolio: string): Observable<null> {
    const cancelRequests = items.map(x => ({
      orderId: x.result.orderNumber,
      portfolio: portfolio,
      exchange: x.sourceOrder.instrument.exchange,
      orderType: x.sourceOrder.type
    }));

    return forkJoin(cancelRequests).pipe(
      map(() => null)
    );
  }
}
