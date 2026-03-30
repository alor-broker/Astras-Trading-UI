import { Injectable, inject } from '@angular/core';
import {
  combineLatest,
  NEVER,
  Observable,
  of,
  shareReplay
} from 'rxjs';
import { NetworkStatus } from '../models/enums/network-status.model';
import { SubscriptionsDataFeedService } from './subscriptions-data-feed.service';
import { map } from 'rxjs/operators';
import { WsOrdersConnector } from "../../client/services/orders/ws-orders-connector";
import { DeviceNetworkService } from './device-network.service';

@Injectable({
  providedIn: 'root'
})
export class NetworkStatusService {
  private readonly subscriptionsDataFeedService = inject(SubscriptionsDataFeedService);
  private readonly wsOrdersConnector = inject(WsOrdersConnector, { optional: true });
  private readonly deviceNetworkService = inject(DeviceNetworkService);

  private networkStatus$?: Observable<NetworkStatus>;

  get status$(): Observable<NetworkStatus> {
    this.networkStatus$ ??= combineLatest([
        this.deviceNetworkService.isOnline$,
        this.subscriptionsDataFeedService.getConnectionStatus(),
        this.wsOrdersConnector?.getConnectionStatus() ?? of(true)
      ]).pipe(
        map(([browserStatus, connectionStatus, wsOrdersConnectorStatus]) => {
          const isConnected = browserStatus && connectionStatus && wsOrdersConnectorStatus;

          return isConnected
            ? NetworkStatus.Online
            : NetworkStatus.Offline;
        }),
        shareReplay(1)
      );

    return this.networkStatus$;
  }

  get lastOrderDelayMSec$(): Observable<number> {
    return this.wsOrdersConnector?.lastOrderDelayMSec$ ?? NEVER;
  }
}
