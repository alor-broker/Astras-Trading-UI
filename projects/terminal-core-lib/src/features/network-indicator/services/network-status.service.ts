import {
  inject,
  Injectable
} from '@angular/core';
import {
  NETWORK_STATUS_PROVIDER,
  ORDER_DELAY_PROVIDER
} from './network-status-service.types';
import {
  combineLatest,
  map,
  NEVER,
  Observable,
  shareReplay
} from 'rxjs';
import {NetworkStatus} from '../netwotk-indicator.types';

@Injectable()
export class NetworkStatusService {
  private readonly statusProviders = inject(NETWORK_STATUS_PROVIDER, {optional: true});

  private readonly orderDelayProvider = inject(ORDER_DELAY_PROVIDER, {optional: true});

  private networkStatus$?: Observable<NetworkStatus>;

  get status$(): Observable<NetworkStatus> {
    this.networkStatus$ ??= combineLatest((this.statusProviders ?? []).map(p => p.isOnline())).pipe(
      map((statuses) => {
        const isConnected = statuses.every((status) => status);

        return isConnected
          ? NetworkStatus.Online
          : NetworkStatus.Offline;
      }),
      shareReplay(1)
    );

    return this.networkStatus$;
  }

  get lastOrderDelayMSec$(): Observable<number> {
    return this.orderDelayProvider?.lastOrderDelayMs() ?? NEVER;
  }
}
