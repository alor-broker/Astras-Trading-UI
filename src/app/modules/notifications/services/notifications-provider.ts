import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { NotificationMeta } from '../models/notification.model';

export interface NotificationHandler {

}

export interface NotificationsProvider extends NotificationHandler {
  getNotifications(): Observable<NotificationMeta[]>;
}

export const NOTIFICATIONS_PROVIDER = new InjectionToken<NotificationsProvider[]>('NotificationsProvider');
