import {
  Component,
  OnInit
} from '@angular/core';
import { NotificationsService } from '../../services/notifications.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { DeviceService } from "../../../../shared/services/device.service";

@Component({
  selector: 'ats-notification-button',
  templateUrl: './notification-button.component.html',
  styleUrls: ['./notification-button.component.less']
})
export class NotificationButtonComponent implements OnInit {
  isTableVisible = false;
  notReadNotificationsCount$!: Observable<number>;
  deviceInfo$!: Observable<{isMobile: boolean}>;

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly deviceService: DeviceService
  ) {
  }

  ngOnInit(): void {
    this.deviceInfo$ = this.deviceService.deviceInfo$;

    this.notReadNotificationsCount$ = this.notificationsService.getNotifications()
      .pipe(
        map(n => n.filter(x => !x.isRead).length),
      );
  }
}
