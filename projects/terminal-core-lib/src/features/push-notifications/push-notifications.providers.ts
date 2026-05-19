import {Provider} from '@angular/core';
import {
  PUSH_NOTIFICATIONS_CONFIG,
  PushNotificationsConfig
} from './types/push-notifications-config.types';
import {PushNotificationsService} from '@terminal-core-lib/features/push-notifications/services/push-notifications.service';

export function providePushNotifications(
  config: PushNotificationsConfig,
  pushNotificationsConnector: Provider): Provider[] {
  return [
    {
      provide: PUSH_NOTIFICATIONS_CONFIG,
      useValue: config
    },
    pushNotificationsConnector,
    PushNotificationsService
  ];
}
