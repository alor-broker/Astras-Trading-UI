import {Provider} from '@angular/core';
import {provideHeaderNotifications} from '@terminal-core-lib/features/header-notifications/services/header-notifications.providers';
import {providePushNotifications} from '@terminal-core-lib/features/push-notifications/push-notifications.providers';
import {PushNotificationsProvider} from '@terminal-core-lib/features/push-notifications/services/push-notifications-provider';
import {PushNotificationsConfig} from '@terminal-core-lib/features/push-notifications/types/push-notifications-config.types';

const defaultPushNotificationsConfig: PushNotificationsConfig = {
  priceChangeNotifications: {
    isSupported: true
  },
  portfolioOrdersExecuteNotifications: {
    isSupported: true
  }
};

export function provideTerminalNotifications(
  pushNotificationsConnector: Provider,
  config: PushNotificationsConfig = defaultPushNotificationsConfig
): Provider[] {
  return [
    ...providePushNotifications(
      config,
      pushNotificationsConnector
    ),
    ...provideHeaderNotifications([
      PushNotificationsProvider
    ])
  ];
}
