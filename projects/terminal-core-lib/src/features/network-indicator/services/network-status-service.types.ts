import {Observable} from 'rxjs';
import {InjectionToken} from '@angular/core';

export interface NetworkStatusProvider {
  isOnline(): Observable<boolean>;
}

export interface OrderDelayProvider {
  lastOrderDelayMs(): Observable<number>;
}

export const NETWORK_STATUS_PROVIDER = new InjectionToken<NetworkStatusProvider[]>('NetworkStatusProvider');
export const ORDER_DELAY_PROVIDER = new InjectionToken<OrderDelayProvider>('OrderDelayProvider');
