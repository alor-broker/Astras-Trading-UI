import {
  inject,
  Injectable
} from '@angular/core';
import {NotificationMeta} from '../header-notifications.types';
import {
  combineLatest,
  map,
  Observable,
  shareReplay
} from 'rxjs';
import {NOTIFICATIONS_PROVIDER} from './header-notifications-service.types';

@Injectable()
export class HeaderNotificationsService {
  private readonly providers = inject(NOTIFICATIONS_PROVIDER, {optional: true});

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
