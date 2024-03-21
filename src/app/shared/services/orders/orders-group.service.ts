import { Injectable } from '@angular/core';
import { catchHttpError } from "../../utils/observable-helper";
import { HttpClient } from "@angular/common/http";
import { ErrorHandlerService } from "../handle-error/error-handler.service";
import { BehaviorSubject, forkJoin, Observable, shareReplay, switchMap, take, tap } from "rxjs";
import { CreateOrderGroupReq, OrdersGroup, SubmitGroupResult } from "../../models/orders/orders-group.model";
import { OrderCancellerService } from "../order-canceller.service";
import { InstantNotificationsService } from "../instant-notifications.service";
import { OrdersInstantNotificationType } from "../../models/terminal-settings/terminal-settings.model";
import { EnvironmentService } from "../environment.service";
import { TranslatorFn, TranslatorService } from "../translator.service";

@Injectable({
  providedIn: 'root'
})
export class OrdersGroupService {
  private readonly orderGroupsUrl = this.environmentService.apiUrl + '/commandapi/api/orderGroups';

  private readonly refresh$ = new BehaviorSubject(null);
  private orderGroups$?: Observable<OrdersGroup[]>;
  private translator$!: Observable<TranslatorFn>;

  constructor(
    private readonly environmentService: EnvironmentService,
    private readonly http: HttpClient,
    private readonly errorHandlerService: ErrorHandlerService,
    private readonly canceller: OrderCancellerService,
    private readonly instantNotificationsService: InstantNotificationsService,
    private readonly translatorService: TranslatorService
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
            this.getTranslatorFn()
              .pipe(take(1))
              .subscribe(t => this.instantNotificationsService.showNotification(
                OrdersInstantNotificationType.OrdersGroupCreated,
                'success',
                t(['ordersGroupCreatedLabel'], { fallback: `Группа создана` }),
                t(
                  ['ordersGroupCreatedContent'],
                  {
                    fallback: `Группа с заявками ${req.orders.map(o => o.orderId).join(', ')} успешно создана`,
                    orderIds: req.orders.map(o => o.orderId).join(', ')
                  })
              ));
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

  private getTranslatorFn(): Observable<TranslatorFn> {
    if (this.translator$ == null) {
      this.translator$ = this.translatorService.getTranslator('shared/orders-notifications')
        .pipe(shareReplay(1));
    }

    return this.translator$;
  }
}
