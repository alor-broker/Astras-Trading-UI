import {InjectionToken} from '@angular/core';
import {Observable} from 'rxjs';
import {
  MessagingStatus,
  PushMessage
} from './push-notifications.types';

export interface MessagingState {
  permission: MessagingStatus;
  swToken: string | null;
}

export interface PushNotificationsConnector {
  getMessagingState(): Observable<MessagingState>;

  getMessages(): Observable<PushMessage>;
}

export const PUSH_NOTIFICATIONS_CONNECTOR = new InjectionToken<PushNotificationsConnector>('PushNotificationsConnector');
