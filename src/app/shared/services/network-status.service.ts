import { Injectable } from '@angular/core';
import {
  combineLatest,
  merge,
  Observable,
  shareReplay
} from 'rxjs';
import { NetworkStatus } from '../models/enums/network-status.model';
import { isOnline$ } from '../utils/network';
import { SubscriptionsDataFeedService } from './subscriptions-data-feed.service';
import { map } from 'rxjs/operators';
import { OrderService } from "./orders/order.service";
import { OrderCancellerService } from "./order-canceller.service";

@Injectable({
  providedIn: 'root'
})
export class NetworkStatusService {
  private networkStatus$?: Observable<NetworkStatus>;

  constructor(
    private readonly subscriptionsDataFeedService: SubscriptionsDataFeedService,
    private readonly orderService: OrderService,
    private readonly orderCancellerService: OrderCancellerService
  ) {
  }

  get status$(): Observable<NetworkStatus> {
    if (!this.networkStatus$) {
      this.networkStatus$ = combineLatest([
        isOnline$(),
        this.subscriptionsDataFeedService.getConnectionStatus()
      ]).pipe(
        map(([browserStatus, connectionStatus]) => {
          const isConnected = browserStatus && connectionStatus;

          return isConnected
            ? NetworkStatus.Online
            : NetworkStatus.Offline;
        }),
        shareReplay(1)
      );
    }

    return this.networkStatus$;
  }

  get lastOrderDelayMSec$(): Observable<number> {
    return merge(
      this.orderService.lastOrderDelayMSec$,
      this.orderCancellerService.lastRequestDelayMSec$
    );
  }
}
