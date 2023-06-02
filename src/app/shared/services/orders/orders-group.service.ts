import { Injectable } from '@angular/core';
import { SubmitOrderResult } from "../../../modules/command/models/order.model";
import { catchHttpError } from "../../utils/observable-helper";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../../environments/environment";
import { ErrorHandlerService } from "../handle-error/error-handler.service";
import { Observable, tap, BehaviorSubject, switchMap, shareReplay, forkJoin } from "rxjs";
import { CreateOrderGroupReq, OrdersGroup } from "../../models/orders/orders-group.model";
import { OrderCancellerService } from "../order-canceller.service";
import { InstantNotificationsService } from "../instant-notifications.service";
import { CommonInstantNotificationType } from "../../models/terminal-settings/terminal-settings.model";


@Injectable({
  providedIn: 'root'
})
export class OrdersGroupService {
  private readonly orderGroupsUrl = environment.apiUrl + '/commandapi/api/orderGroups';

  private refresh$ = new BehaviorSubject(null);
  private orderGroups$?: Observable<OrdersGroup[]>;

  constructor(
    private readonly http: HttpClient,
    private readonly errorHandlerService: ErrorHandlerService,
    private readonly canceller: OrderCancellerService,
    private readonly instantNotificationsService: InstantNotificationsService
  ) { }

  createOrdersGroup(req: CreateOrderGroupReq) {
    return this.http.post<SubmitOrderResult>(this.orderGroupsUrl, req)
      .pipe(
        catchHttpError<SubmitOrderResult>({ isSuccess: false }, this.errorHandlerService),
        tap((res) => {
          if (res.isSuccess === false) {
            forkJoin([
              req.orders.map(o => this.canceller.cancelOrder({
                orderid: o.orderId,
                portfolio: o.portfolio,
                exchange: o.exchange,
                stop: o.type !== 'Limit'
              }))
            ])
              .subscribe();
          } else {
            this.refresh$.next(null);
            this.instantNotificationsService.showNotification(
              CommonInstantNotificationType.Common,
              'success',
              `Группа создана`,
              `Группа с заявками ${req.orders.map(o => o.orderId).join(', ')} успешно создана`
            );
          }
        })
      );
  }

  getAllOrderGroups(): Observable<OrdersGroup[]> {
    if (!this.orderGroups$) {
      this.orderGroups$ = this.refresh$
        .pipe(
          switchMap(() => this.http.get<OrdersGroup[]>(`${this.orderGroupsUrl}`)),
          shareReplay(1)
        );
    }

    this.refresh$.next(null);

    return this.orderGroups$;
  }
}
