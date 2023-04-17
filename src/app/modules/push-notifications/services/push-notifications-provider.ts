import { Injectable } from '@angular/core';
import { NotificationsProvider } from '../../notifications/services/notifications-provider';
import { Observable, shareReplay, switchMap } from 'rxjs';
import { NotificationMeta } from '../../notifications/models/notification.model';
import { map, startWith } from "rxjs/operators";
import { PushNotificationsService } from "./push-notifications.service";

@Injectable()
export class PushNotificationsProvider implements NotificationsProvider {
  private notifications$?: Observable<NotificationMeta[]>;

  private allMessages = new Map<string, NotificationMeta>();

  constructor(
    private readonly pushNotificationsService: PushNotificationsService
  ) {
  }

  getNotifications(): Observable<NotificationMeta[]> {
    if (this.notifications$) {
      return this.notifications$;
    }

    this.notifications$ = this.pushNotificationsService.subscribeToOrderExecute()
      .pipe(
        switchMap(() => this.pushNotificationsService.getMessages()),
        map((payload) => {
          if (!!payload?.data?.body) {
            const messageData = JSON.parse(payload.data.body).notification;

            if (!!messageData) {
              this.allMessages.set(payload.messageId,  {
                id: payload.messageId,
                date: new Date(),
                title: messageData.title,
                description: messageData.body,
                isRead: false,
                showDate: true
              });
            }
          }

          return Array.from(this.allMessages.values());
        }),
        startWith([]),
        shareReplay(),
      );

    return this.notifications$;
  }
}
