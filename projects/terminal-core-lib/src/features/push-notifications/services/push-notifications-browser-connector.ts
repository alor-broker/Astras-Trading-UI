import {
  catchError,
  from,
  fromEvent,
  map,
  Observable,
  of,
  shareReplay,
  switchMap,
  take
} from "rxjs";
import {
  MessagingState,
  PushNotificationsConnector
} from '../types/push-notifications-connector.types';
import firebase from 'firebase/compat/app';
import 'firebase/compat/messaging';
import {MessagingStatus} from './push-notifications.service';
import {
  inject,
  Injectable
} from '@angular/core';
import {LoggerService} from '../../logging/services/logger-service';
import {PushLogsFormatHelper} from '../utils/push-logs-format.helper';
import {Platform} from '@angular/cdk/platform';
import {FIREBASE_MESSAGING_CONFIG} from '../types/firebase-messaging-config.types';
import {PushMessage} from '../types/push-notifications.types';
import isSupported = firebase.messaging.isSupported;

export interface MessagePayload extends firebase.messaging.MessagePayload {
  data?: {
    body?: string;
  };
  messageId: string;
}

@Injectable()
export class PushNotificationsBrowserConnector implements PushNotificationsConnector {
  protected readonly loggerService = inject(LoggerService);

  protected readonly platform = inject(Platform);

  protected readonly firebaseMessagingConfig = inject(FIREBASE_MESSAGING_CONFIG);

  protected messagingState$: Observable<MessagingState> | null = null;

  private webMessaging: firebase.messaging.Messaging | null = null;

  getMessagingState(): Observable<MessagingState> {
    if (this.messagingState$ == null) {
      if (window.Notification == null || !isSupported()) {
        this.messagingState$ = of({
          permission: 'not-supported' as MessagingStatus,
          swToken: null
        }).pipe(
          shareReplay(1)
        );

        this.loggerService.info(PushLogsFormatHelper.formatLogMessage('Push is not supported'));
      } else {
        let base = of(null);

        if (this.platform.SAFARI) {
          base = fromEvent(document, 'click').pipe(
            map(() => null)
          );
        }

        this.messagingState$ = base.pipe(
          take(1),
          switchMap(() => navigator.serviceWorker.ready),
          switchMap(() => Notification.requestPermission()),
          catchError(e => {
            this.loggerService.error(PushLogsFormatHelper.formatLogMessage(`Unable to request permission. Details: ${e}`));
            return of(null);
          }),
          switchMap(p => {
            this.loggerService.info(`Push permission: ${p ?? ''}`);

            if (p == null || p !== 'granted') {
              return of({
                permission: p ?? 'not-supported' as MessagingStatus,
                swToken: null
              });
            }

            return from(this.getWebMessaging().getToken()).pipe(
              catchError(e => {
                this.loggerService.warn(PushLogsFormatHelper.formatLogMessage(`Unable to get FCM token. Details: ${e}`));
                return of(null);
              }),
              map(t => {
                if (t != null && t.length > 0) {
                  return {
                    permission: p,
                    swToken: t
                  };
                }

                return {
                  permission: p,
                  swToken: null
                };
              })
            );
          }),
          take(1),
          shareReplay(1)
        );
      }
    }

    return this.messagingState$;
  }

  getMessages(): Observable<PushMessage> {
    return new Observable<PushMessage>(subscriber => {
      const unsubscribe = this.getWebMessaging().onMessage(value => {
        const convertedMessage = this.toPushMessage(value);
        if (convertedMessage != null) {
          subscriber.next(convertedMessage);
        }
      });
      return (): void => unsubscribe();
    });
  }

  protected toPushMessage(firebasePayload: MessagePayload): PushMessage | null {
    let messageData = firebasePayload.notification;

    if (messageData == null && firebasePayload.data?.body != null) {
      messageData = JSON.parse(firebasePayload.data.body).notification as { title: string, body: string } | undefined;
    }

    if (!messageData) {
      return null;
    }

    return {
      messageId: firebasePayload.messageId,
      title: messageData.title ?? '',
      body: messageData.body ?? ''
    }
  }

  private getWebMessaging(): firebase.messaging.Messaging {
    if (this.webMessaging == null) {
      const app = firebase.initializeApp(this.firebaseMessagingConfig);
      this.webMessaging = firebase.messaging(app);
    }

    return this.webMessaging;
  }
}
