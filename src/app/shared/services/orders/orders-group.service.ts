import { Injectable } from '@angular/core';
import { SubmitOrderResult } from "../../../modules/command/models/order.model";
import { catchHttpError } from "../../utils/observable-helper";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../../environments/environment";
import { ErrorHandlerService } from "../handle-error/error-handler.service";
import { Observable, map, tap, BehaviorSubject, switchMap, shareReplay } from "rxjs";
import { OrdersGroup, OrdersGroupRes } from "../../models/orders/orders-group.model";

interface CreateOrderGroupReq {
  orders: {
      orderId: string;
      exchange: string;
      portfolio: string;
      type: 'Limit' | 'StopLimit';
    }[],
  ExecutionPolicy: string;
}

@Injectable({
  providedIn: 'root'
})
export class OrdersGroupService {
  private readonly orderGroupsUrl = environment.apiUrl + '/commandapi/api/orderGroups';

  private refresh$ = new BehaviorSubject(null);
  private orderGroups$?: Observable<OrdersGroup[]>;

  constructor(
    private readonly http: HttpClient,
    private readonly errorHandlerService: ErrorHandlerService
  ) { }

  createOrdersGroup(req: CreateOrderGroupReq) {
    return this.http.post<SubmitOrderResult>(this.orderGroupsUrl, req)
      .pipe(
        catchHttpError<SubmitOrderResult>({ isSuccess: false }, this.errorHandlerService),
        tap(() => this.refresh$.next(null))
      );
  }

  getAllOrderGroups(): Observable<OrdersGroup[]> {
    if (!this.orderGroups$) {
      this.orderGroups$ = this.refresh$
        .pipe(
          switchMap(() => this.http.get<OrdersGroupRes[]>(`${this.orderGroupsUrl}`)),
          map(groups => groups.map(g => ({
            id: g.Id,
            executionPolicy: g.ExecutionPolicy,
            status: g.Status,
            orders: g.Orders.map(o => ({
              exchange: o.Exchange,
              portfolio: o.Portfolio,
              orderId: o.OrderId,
              type: o.Type
            }))
          }))),
          shareReplay(1)
        );
    }

    this.refresh$.next(null);

    return this.orderGroups$;
  }
}
