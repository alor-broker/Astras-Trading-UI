import {Observable} from 'rxjs';
import {NotificationMeta} from '../header-notifications.types';
import {InjectionToken} from '@angular/core';

export interface NotificationsProvider {
  getNotifications(): Observable<NotificationMeta[]>;
}

export const NOTIFICATIONS_PROVIDER = new InjectionToken<NotificationsProvider[]>('NotificationsProvider');
