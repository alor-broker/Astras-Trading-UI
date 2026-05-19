import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import {HeaderNotificationsService} from '../../services/header-notifications.service';
import {
  map,
  Observable
} from 'rxjs';
import {NzBadgeComponent} from 'ng-zorro-antd/badge';
import {AsyncPipe} from '@angular/common';
import {NzPopoverDirective} from 'ng-zorro-antd/popover';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {NotificationList} from '../notification-list/notification-list';
import {TranslocoDirective} from '@jsverse/transloco';

@Component({
  selector: 'ats-notifications-nav-btn',
  imports: [
    NzBadgeComponent,
    AsyncPipe,
    NzPopoverDirective,
    NzButtonComponent,
    NzIconDirective,
    NotificationList,
    TranslocoDirective
  ],
  templateUrl: './notifications-nav-btn.html',
  styleUrl: './notifications-nav-btn.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [
    HeaderNotificationsService
  ]
})
export class NotificationsNavBtn implements OnInit {
  isTableVisible = false;

  notReadNotificationsCount$!: Observable<number>;

  private readonly notificationsService = inject(HeaderNotificationsService);

  ngOnInit(): void {
    this.notReadNotificationsCount$ = this.notificationsService.getNotifications()
      .pipe(
        map(n => n.filter(x => !x.isRead).length),
      );
  }
}
