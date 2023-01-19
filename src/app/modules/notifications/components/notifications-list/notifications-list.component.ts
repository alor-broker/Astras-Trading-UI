import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { NotificationsService } from "../../services/notifications.service";
import { Observable } from "rxjs";
import { NotificationMeta } from "../../models/notification.model";
import { map } from "rxjs/operators";
import { DeviceService } from "../../../../shared/services/device.service";

@Component({
  selector: 'ats-notifications-list',
  templateUrl: './notifications-list.component.html',
  styleUrls: ['./notifications-list.component.less']
})
export class NotificationsListComponent implements OnInit {
  sortedNotifications$!: Observable<NotificationMeta[]>;
  isMobile$!: Observable<boolean>;

  @Output() notificationClicked = new EventEmitter();

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly deviceService: DeviceService
  ) {
  }

  ngOnInit() {
    this.sortedNotifications$ = this.notificationsService.getNotifications()
      .pipe(
        map(n => [...n]),
        map(n => n.sort((a, b) => b.date.getTime() - a.date.getTime()))
      );

    this.isMobile$ = this.deviceService.deviceInfo$
      .pipe(
        map(info => info.isMobile)
      );
  }

  clickNotification(notification: NotificationMeta) {
    this.notificationClicked.emit();
    notification.markAsRead?.();
    notification.open?.();
  }
}
