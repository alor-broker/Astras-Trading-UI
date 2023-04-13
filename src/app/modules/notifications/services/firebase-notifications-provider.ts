import { Injectable } from '@angular/core';
import { NotificationsProvider } from './notifications-provider';
import { BehaviorSubject, Observable, take } from 'rxjs';
import { NotificationMeta } from '../models/notification.model';
import { AngularFireMessaging } from "@angular/fire/compat/messaging";
import firebase from "firebase/compat";

@Injectable()
export class FirebaseNotificationsProvider implements NotificationsProvider {
  private notificationsSubject = new BehaviorSubject<NotificationMeta[]>([]);
  private notifications$ = this.notificationsSubject.asObservable();

  constructor(
    private readonly angularFireMessaging: AngularFireMessaging,
  ) {
    angularFireMessaging.messages.subscribe((payload: firebase.messaging.MessagePayload) => {
      if (!payload?.data?.body) {
        return;
      }

      const messageData = JSON.parse(payload.data.body).notification;

      if (!messageData) {
        return;
      }

      this.notifications$
        .pipe(take(1))
        .subscribe(notifications => this.notificationsSubject.next([
          {
            id: messageData.messageId,
            date: new Date(),
            title: messageData.title,
            description: messageData.body,
            isRead: false,
            showDate: true
          },
          ...notifications
        ]));
    });
  }

  getNotifications(): Observable<NotificationMeta[]> {
    return this.notifications$;
  }
}
