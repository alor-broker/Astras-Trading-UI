import {
  inject,
  Injectable
} from '@angular/core';
import {
  distinctUntilChanged,
  firstValueFrom,
  from,
  fromEvent,
  merge,
  Observable,
  of,
  shareReplay,
  switchMap,
  tap
} from 'rxjs';
import {CORE_API_URL_PROVIDER} from '../../config/api-url-providers';
import {HttpClient} from '@angular/common/http';
import {NetworkStatusProvider} from '@terminal-core-lib/features/network-indicator/services/network-status-service.types';
import {Capacitor} from '@capacitor/core';
import {Network} from '@capacitor/network';
import {LoggerService} from '../../features/logging/services/logger-service';

@Injectable({providedIn: 'root'})
export class DeviceNetworkService implements NetworkStatusProvider {
  public readonly isOnline$: Observable<boolean>;

  private readonly coreApiUrlProvider = inject(CORE_API_URL_PROVIDER);

  private readonly httpClient = inject(HttpClient);

  private readonly loggerService = inject(LoggerService);

  constructor() {
    this.isOnline$ = this.createIsOnlineStream();
  }

  isOnline(): Observable<boolean> {
    return this.isOnline$;
  }

  private createIsOnlineStream(): Observable<boolean> {
    if (Capacitor.isNativePlatform()) {
      return new Observable<boolean>(observer => {
        const handleStatusChange = (status: { connected: boolean }): void => {
          const isConnected = status.connected;
          observer.next(isConnected);

          if (isConnected) {
            this.checkInternetReachability().then(reachable => {
              if (reachable !== isConnected) {
                observer.next(reachable);
              }
            });
          }
        };

        Network.getStatus().then(handleStatusChange);
        const handler = Network.addListener('networkStatusChange', handleStatusChange);

        return () => {
          handler.then(h => h.remove());
        };
      }).pipe(
        distinctUntilChanged(),
        shareReplay({bufferSize: 1, refCount: true})
      );
    }

    return merge(
      of(null),
      fromEvent(window, 'online'),
      fromEvent(window, 'offline')
    ).pipe(
      switchMap(() => {
        if (navigator.onLine) {
          return from(this.checkInternetReachability());
        }
        return of(false);
      }),
      distinctUntilChanged(),
      tap(isOnline => this.loggerService.debug(`isOnline: ${isOnline}`)),
      shareReplay({bufferSize: 1, refCount: true})
    );
  }

  private async checkInternetReachability(): Promise<boolean> {
    try {
      await firstValueFrom(
        this.httpClient.get<number>(`${this.coreApiUrlProvider.apiUrl}/md/v2/time`)
      );
      return true;
    } catch (e: any) {
      // If status is greater than 0, it means we received a response (even if it's an error like 404 or 500).
      // This confirms that the server is reachable.
      // Status 0 usually indicates a network error or CORS issue.
      return e.status != null && e.status > 0;
    }
  }
}
