import {InjectionToken} from "@angular/core";

export interface PushNotificationsConfig {
  priceChangeNotifications: {
    isSupported: boolean;
  };

  portfolioOrdersExecuteNotifications: {
    isSupported: boolean;
  };
}

export const PUSH_NOTIFICATIONS_CONFIG = new InjectionToken<PushNotificationsConfig>('PushNotificationsConfig');
