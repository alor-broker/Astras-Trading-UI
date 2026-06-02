import {MessagingState} from '@terminal-core-lib/features/push-notifications/types/push-notifications-connector.types';
import {Injectable} from '@angular/core';
import {
  MessagingStatus,
  PushMessage
} from "@terminal-core-lib/features/push-notifications/types/push-notifications.types";
import {
  catchError,
  from,
  map,
  Observable,
  of,
  shareReplay,
  switchMap
} from "rxjs";
import {
  MessagePayload,
  PushNotificationsBrowserConnector
} from '@terminal-core-lib/features/push-notifications/services/push-notifications-browser-connector';
import {Capacitor} from "@capacitor/core";
import {FirebaseMessaging} from '@capacitor-firebase/messaging';
import {PushLogsFormatHelper} from '@terminal-core-lib/features/push-notifications/utils/push-logs-format.helper';

@Injectable()
export class MobilePushNotificationsConnector extends PushNotificationsBrowserConnector {
  override getMessagingState(): Observable<MessagingState> {
    if (this.messagingState$ == null) {
      if (Capacitor.isNativePlatform()) {
        this.messagingState$ = from(FirebaseMessaging.requestPermissions()).pipe(
          switchMap(permission => {
            const status = permission.receive === 'granted' ? 'granted' : 'denied';
            this.loggerService.info(`Push permission: ${status}`);

            if (status !== 'granted') {
              return of({
                permission: status as MessagingStatus,
                swToken: null
              });
            }

            return from(FirebaseMessaging.getToken()).pipe(
              catchError(e => {
                this.loggerService.warn(PushLogsFormatHelper.formatLogMessage(`Unable to get FCM token. Details: ${e}`));
                return of(null);
              }),
              map(result => {
                const t = result?.token;
                if (t != null && t.length > 0) {
                  return {
                    permission: status as MessagingStatus,
                    swToken: t
                  };
                }

                return {
                  permission: status as MessagingStatus,
                  swToken: null
                };
              })
            );
          }),
          shareReplay(1)
        );
      } else {
        return super.getMessagingState();
      }
    }

    return this.messagingState$;
  }

  override getMessages(): Observable<PushMessage> {
    if (Capacitor.isNativePlatform()) {
      return new Observable<PushMessage>(subscriber => {
        const listenerPromise = FirebaseMessaging.addListener('notificationReceived', (event) => {
          const message: MessagePayload = {
            messageId: event.notification.id ?? '',
            data: event.notification.data as { body?: string },
            notification: {
              title: event.notification.title,
              body: event.notification.body,
              image: event.notification.image
            },
            from: '',
            collapseKey: ''
          };

          const convertedMessage = this.toPushMessage(message);
          if (convertedMessage != null) {
            subscriber.next(convertedMessage);
          }
        });

        return (): void => {
          listenerPromise.then(listener => listener.remove());
        };
      });
    } else {
      return super.getMessages();
    }
  }
}
