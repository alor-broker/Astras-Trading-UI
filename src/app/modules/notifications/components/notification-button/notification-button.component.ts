import {
  ChangeDetectionStrategy,
  Component,
  OnInit
} from '@angular/core';
import { NotificationsService } from '../../services/notifications.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
    selector: 'ats-notification-button',
    templateUrl: './notification-button.component.html',
    styleUrls: ['./notification-button.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class NotificationButtonComponent implements OnInit {
  isTableVisible = false;
  notReadNotificationsCount$!: Observable<number>;

  constructor(
    private readonly notificationsService: NotificationsService
  ) {
  }

  ngOnInit(): void {
    this.notReadNotificationsCount$ = this.notificationsService.getNotifications()
      .pipe(
        map(n => n.filter(x => !x.isRead).length),
      );
  }
}
