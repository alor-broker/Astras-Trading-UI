import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  output,
  ViewEncapsulation
} from '@angular/core';
import {HeaderNotificationsService} from '../../services/header-notifications.service';
import {
  map,
  Observable
} from 'rxjs';
import {NotificationMeta} from '../../header-notifications.types';
import {isToday} from 'date-fns';
import {
  AsyncPipe,
  DatePipe
} from '@angular/common';
import {NzTableComponent} from 'ng-zorro-antd/table';
import {NzBadgeComponent} from 'ng-zorro-antd/badge';
import {NzTypographyComponent} from 'ng-zorro-antd/typography';
import {TableRowHeight} from '../../../../common/directives/table-row-height';

@Component({
  selector: 'ats-notification-list',
  imports: [
    AsyncPipe,
    NzTableComponent,
    NzBadgeComponent,
    DatePipe,
    NzTypographyComponent,
    TableRowHeight
  ],
  templateUrl: './notification-list.html',
  styleUrl: './notification-list.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class NotificationList implements OnInit {
  sortedNotifications$!: Observable<NotificationMeta[]>;

  readonly notificationClicked = output();

  private readonly notificationsService = inject(HeaderNotificationsService);

  ngOnInit(): void {
    this.sortedNotifications$ = this.notificationsService.getNotifications()
      .pipe(
        map(n => [...n]),
        map(n => n.sort((a, b) => b.date.getTime() - a.date.getTime()))
      );
  }

  clickNotification(notification: NotificationMeta): void {
    this.notificationClicked.emit();
    notification.markAsRead?.();
    notification.open?.();
  }

  isTodayDate(date: Date): boolean {
    return isToday(date);
  }
}
