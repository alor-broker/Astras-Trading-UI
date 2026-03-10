import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { NotificationMeta } from '../models/notification.model';

export interface NotificationsProvider {
  getNotifications(): Observable<NotificationMeta[]>;
}

export const NOTIFICATIONS_PROVIDER = new InjectionToken<NotificationsProvider[]>('NotificationsProvider');
