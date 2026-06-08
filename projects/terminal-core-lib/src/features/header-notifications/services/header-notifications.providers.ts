import {
  Provider,
  Type
} from '@angular/core';
import {LoggerService} from '../../logging/services/logger-service';
import {NOTIFICATIONS_PROVIDER} from './header-notifications-service.types';

export function provideHeaderNotifications(notificationProviders: Type<unknown>[]): Provider[] {
  return [
    ...notificationProviders.map(t => ({
      provide: NOTIFICATIONS_PROVIDER,
      useClass: t,
      multi: true
    })),
    LoggerService
  ];
}
