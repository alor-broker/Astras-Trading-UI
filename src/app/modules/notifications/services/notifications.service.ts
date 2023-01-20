import {
  Inject,
  Injectable
} from '@angular/core';
import {
  NOTIFICATIONS_PROVIDER,
  NotificationsProvider
} from './notifications-provider';
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
  private readonly notifications: Observable<NotificationMeta[]>;

  constructor(
    @Inject(NOTIFICATIONS_PROVIDER)
    private readonly providers: NotificationsProvider[]
  ) {
    const allNotifications: Observable<NotificationMeta[]>[] = [];

    const allProviders = providers ?? [];
    for (let i = 0; i < allProviders.length; i++) {
      const provider = allProviders[i];

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
