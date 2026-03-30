import { Injectable, inject } from '@angular/core';
import { catchHttpError } from "../../utils/observable-helper";
import { HttpClient } from "@angular/common/http";
import { ErrorHandlerService } from "../handle-error/error-handler.service";
import {
  Observable,
  shareReplay,
  switchMap
} from "rxjs";
import {
  GroupCreatedEventKey,
  OrdersGroup
} from "../../models/orders/orders-group.model";
import { EnvironmentService } from "../environment.service";
import { EventBusService } from "../event-bus.service";
import { startWith } from "rxjs/operators";

@Injectable({
  providedIn: 'root'
})
export class OrdersGroupService {
  private readonly environmentService = inject(EnvironmentService);
  private readonly httpClient = inject(HttpClient);
  private readonly errorHandlerService = inject(ErrorHandlerService);
  private readonly eventBusService = inject(EventBusService);

  private readonly orderGroupsUrl = this.environmentService.apiUrl + '/commandapi/api/orderGroups';
  private orderGroups$?: Observable<OrdersGroup[]>;

  getAllOrderGroups(): Observable<OrdersGroup[]> {
    this.orderGroups$ ??= this.eventBusService.subscribe(event => event.key === GroupCreatedEventKey)
        .pipe(
          startWith(null),
          switchMap(() => this.httpClient.get<OrdersGroup[]>(`${this.orderGroupsUrl}`)),
          catchHttpError<OrdersGroup[]>([], this.errorHandlerService),
          shareReplay(1)
        );

    return this.orderGroups$;
  }
}
