import { Injectable } from '@angular/core';
import { NotificationsProvider } from '../../notifications/services/notifications-provider';
import { BehaviorSubject, Observable, switchMap } from 'rxjs';
import { NotificationMeta } from '../../notifications/models/notification.model';
import { PushNotificationsService } from "./push-notifications.service";

@Injectable()
export class PushNotificationsProvider implements NotificationsProvider {
  private notifications$?: BehaviorSubject<NotificationMeta[]>;

  private allMessages = new Map<string, NotificationMeta>();

  constructor(
    private readonly pushNotificationsService: PushNotificationsService
  ) {
  }

  getNotifications(): Observable<NotificationMeta[]> {
    if (this.notifications$) {
      return this.notifications$.asObservable();
    }

    this.notifications$ = new BehaviorSubject<NotificationMeta[]>([]);

    this.pushNotificationsService.subscribeToOrderExecute()
      .pipe(
        switchMap(() => this.pushNotificationsService.getMessages())
      )
      .subscribe((payload) => {
        if (!payload?.data?.body) {
          return;
        }

        const messageData = JSON.parse(payload.data.body).notification;

        if (!messageData) {
          return;
        }

        const notification: NotificationMeta = {
          id: payload.messageId,
          date: new Date(),
          title: messageData.title,
          description: messageData.body,
          isRead: false,
          showDate: true,
          markAsRead: () => {
            this.allMessages.set(payload.messageId, {
              ...notification,
              isRead: true
            });

            this.notifications$!.next(Array.from(this.allMessages.values()));
          }
        };

        this.allMessages.set(payload.messageId, notification);

        this.notifications$!.next(Array.from(this.allMessages.values()));
      });

    return this.notifications$.asObservable();
  }
}
