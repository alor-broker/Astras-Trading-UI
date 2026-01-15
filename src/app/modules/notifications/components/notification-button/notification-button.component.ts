import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import {NotificationsService} from '../../services/notifications.service';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {NzBadgeComponent} from 'ng-zorro-antd/badge';
import {NzPopoverDirective} from 'ng-zorro-antd/popover';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {TranslocoDirective} from '@jsverse/transloco';
import {NotificationsListComponent} from '../notifications-list/notifications-list.component';
import {AsyncPipe} from '@angular/common';

@Component({
  selector: 'ats-notification-button',
  templateUrl: './notification-button.component.html',
  styleUrls: ['./notification-button.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NzBadgeComponent,
    NzPopoverDirective,
    NzButtonComponent,
    NzIconDirective,
    TranslocoDirective,
    NotificationsListComponent,
    AsyncPipe
  ]
})
export class NotificationButtonComponent implements OnInit {
  private readonly notificationsService = inject(NotificationsService);

  isTableVisible = false;
  notReadNotificationsCount$!: Observable<number>;

  ngOnInit(): void {
    this.notReadNotificationsCount$ = this.notificationsService.getNotifications()
      .pipe(
        map(n => n.filter(x => !x.isRead).length),
      );
  }
}
