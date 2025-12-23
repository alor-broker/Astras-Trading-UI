import { Component, OnInit, output, inject } from '@angular/core';
import {NotificationsService} from "../../services/notifications.service";
import {Observable} from "rxjs";
import {NotificationMeta} from "../../models/notification.model";
import {map} from "rxjs/operators";
import {isToday} from "date-fns";
import {NzTableCellDirective, NzTableComponent, NzTbodyComponent, NzTrDirective} from 'ng-zorro-antd/table';
import {TableRowHeightDirective} from '../../../../shared/directives/table-row-height.directive';
import {AsyncPipe, DatePipe, NgClass} from '@angular/common';
import {NzBadgeComponent} from 'ng-zorro-antd/badge';
import {NzTypographyComponent} from 'ng-zorro-antd/typography';

@Component({
  selector: 'ats-notifications-list',
  templateUrl: './notifications-list.component.html',
  styleUrls: ['./notifications-list.component.less'],
  imports: [
    NzTableComponent,
    TableRowHeightDirective,
    NzTbodyComponent,
    NzTrDirective,
    NzTableCellDirective,
    NgClass,
    NzBadgeComponent,
    NzTypographyComponent,
    AsyncPipe,
    DatePipe
  ]
})
export class NotificationsListComponent implements OnInit {
  private readonly notificationsService = inject(NotificationsService);

  sortedNotifications$!: Observable<NotificationMeta[]>;

  readonly notificationClicked = output();

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
