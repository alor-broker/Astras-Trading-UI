import {
  Component,
  OnInit
} from '@angular/core';
import { NotificationsService } from '../../services/notifications.service';
import {
  Observable,
  shareReplay
} from 'rxjs';
import { NotificationMeta } from '../../models/notification.model';
import { map } from 'rxjs/operators';

@Component({
  selector: 'ats-notification-button',
  templateUrl: './notification-button.component.html',
  styleUrls: ['./notification-button.component.less']
})
export class NotificationButtonComponent implements OnInit {
  isTableVisible = false;
  private notifications$!: Observable<NotificationMeta[]>;

  constructor(private readonly notificationsService: NotificationsService) {
  }

  get notReadNotificationsCount$(): Observable<number> {
    return this.notifications$.pipe(
      map(n => n.filter(x => !x.isRead).length),
    );
  }

  get sortedNotifications$(): Observable<NotificationMeta[]> {
    return this.notifications$.pipe(
      map(n => [...n]),
      map(n => n.sort((a, b) => b.date.getTime() - a.date.getTime()))
    );
  }

  ngOnInit(): void {
    this.notifications$ = this.notificationsService.getNotifications().pipe(
      shareReplay(1)
    );
  }

  markAsRead(notification: NotificationMeta) {
    notification.markAsRead?.();
  }

  clickNotification(notification: NotificationMeta) {
    notification.markAsRead?.();
    notification.open?.();
  }
}
