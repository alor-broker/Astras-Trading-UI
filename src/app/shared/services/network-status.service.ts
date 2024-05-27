import { Injectable } from '@angular/core';
import {
  combineLatest,
  Observable,
  shareReplay
} from 'rxjs';
import { NetworkStatus } from '../models/enums/network-status.model';
import { isOnline$ } from '../utils/network';
import { SubscriptionsDataFeedService } from './subscriptions-data-feed.service';
import { map } from 'rxjs/operators';
import { WsOrdersConnector } from "./orders/ws-orders-connector";

@Injectable({
  providedIn: 'root'
})
export class NetworkStatusService {
  private networkStatus$?: Observable<NetworkStatus>;

  constructor(
    private readonly subscriptionsDataFeedService: SubscriptionsDataFeedService,
    private readonly wsOrdersConnector: WsOrdersConnector
  ) {
  }

  get status$(): Observable<NetworkStatus> {
    if (!this.networkStatus$) {
      this.networkStatus$ = combineLatest([
        isOnline$(),
        this.subscriptionsDataFeedService.getConnectionStatus(),
        this.wsOrdersConnector.getConnectionStatus()
      ]).pipe(
        map(([browserStatus, connectionStatus, wsOrdersConnectorStatus]) => {
          const isConnected = browserStatus && connectionStatus && wsOrdersConnectorStatus;

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
    return this.wsOrdersConnector.lastOrderDelayMSec$;
  }
}
