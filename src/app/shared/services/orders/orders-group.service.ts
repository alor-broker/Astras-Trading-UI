import { Injectable } from '@angular/core';
import { catchHttpError } from "../../utils/observable-helper";
import { HttpClient } from "@angular/common/http";
import { ErrorHandlerService } from "../handle-error/error-handler.service";
import { BehaviorSubject, forkJoin, Observable, shareReplay, switchMap, tap } from "rxjs";
import { CreateOrderGroupReq, OrdersGroup, SubmitGroupResult } from "../../models/orders/orders-group.model";
import { OrderCancellerService } from "../order-canceller.service";
import { EnvironmentService } from "../environment.service";
import { OrderInstantTranslatableNotificationsService } from "./order-instant-translatable-notifications.service";

@Injectable({
  providedIn: 'root'
})
export class OrdersGroupService {
  private readonly orderGroupsUrl = this.environmentService.apiUrl + '/commandapi/api/orderGroups';

  private readonly refresh$ = new BehaviorSubject(null);
  private orderGroups$?: Observable<OrdersGroup[]>;

  constructor(
    private readonly environmentService: EnvironmentService,
    private readonly http: HttpClient,
    private readonly errorHandlerService: ErrorHandlerService,
    private readonly canceller: OrderCancellerService,
    private readonly instantNotificationsService: OrderInstantTranslatableNotificationsService
  ) {
  }

  createOrdersGroup(req: CreateOrderGroupReq): Observable<SubmitGroupResult | null> {
    return this.http.post<SubmitGroupResult>(this.orderGroupsUrl, req)
      .pipe(
        catchHttpError<SubmitGroupResult | null>(null, this.errorHandlerService),
        tap(res => {
          if (!res || res.message !== 'success') {
            forkJoin(
              req.orders.map(o => this.canceller.cancelOrder({
                  orderid: o.orderId,
                  portfolio: o.portfolio,
                  exchange: o.exchange,
                  stop: o.type !== 'Limit'
                })
              )
            ).subscribe();
          } else {
            this.refresh$.next(null);
            this.instantNotificationsService.ordersGroupCreated(req.orders.map(o => o.orderId).join(', '));
          }
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
}
