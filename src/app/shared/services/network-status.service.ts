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

@Injectable({
  providedIn: 'root'
})
export class NetworkStatusService {
  private networkStatus$?: Observable<NetworkStatus>;

  constructor(private readonly subscriptionsDataFeedService: SubscriptionsDataFeedService) {
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
}
