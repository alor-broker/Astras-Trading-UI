import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { fromEvent, merge, Observable, of, from, firstValueFrom } from "rxjs";
import { switchMap, distinctUntilChanged, shareReplay, tap } from "rxjs/operators";
import { Network } from '@capacitor/network';
import { Capacitor } from '@capacitor/core';
import { EnvironmentService } from './environment.service';

@Injectable({
  providedIn: 'root'
})
export class DeviceNetworkService {
  private readonly environmentService = inject(EnvironmentService);
  private readonly httpClient = inject(HttpClient);

  public readonly isOnline$: Observable<boolean>;

  constructor() {
    this.isOnline$ = this.createIsOnlineStream();
  }

  private isHttpErrorWithStatus(error: unknown): error is { status: number } {
    return typeof error === 'object'
      && error != null
      && 'status' in error
      && typeof error.status === 'number';
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
        shareReplay({ bufferSize: 1, refCount: true })
      );
    } else {
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
        tap(x => console.log('isOnline:', x)),
        shareReplay({ bufferSize: 1, refCount: true })
      );
    }
  }

  private async checkInternetReachability(): Promise<boolean> {
    try {
      await firstValueFrom(
        this.httpClient.get<number>(`${this.environmentService.apiUrl}/md/v2/time`)
      );
      return true;
    } catch (e: unknown) {
      // If status is greater than 0, it means we received a response (even if it's an error like 404 or 500).
      // This confirms that the server is reachable.
      // Status 0 usually indicates a network error or CORS issue.
      return this.isHttpErrorWithStatus(e) && e.status > 0;
    }
  }
}
