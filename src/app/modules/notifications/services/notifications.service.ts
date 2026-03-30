import { Injectable, inject } from '@angular/core';
import { NOTIFICATIONS_PROVIDER } from './notifications-provider';
import {
  combineLatest,
  Observable,
  shareReplay
} from 'rxjs';
import { NotificationMeta } from '../models/notification.model';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class NotificationsService {
  private readonly providers = inject(NOTIFICATIONS_PROVIDER, { optional: true });

  private readonly notifications: Observable<NotificationMeta[]>;

  constructor() {
    const providers = this.providers;

    const allNotifications: Observable<NotificationMeta[]>[] = [];

    const allProviders = providers ?? [];
    for (const provider of allProviders) {
      allNotifications.push(provider.getNotifications());
    }

    this.notifications = combineLatest(allNotifications).pipe(
      map(notifications => notifications.reduce((previousValue, currentValue) => [...previousValue, ...currentValue], []))
    );
  }

  getNotifications(): Observable<NotificationMeta[]> {
    return this.notifications.pipe(
      shareReplay(1)
    );
  }
}
