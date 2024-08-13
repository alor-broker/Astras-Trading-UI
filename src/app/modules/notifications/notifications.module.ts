import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationButtonComponent } from './components/notification-button/notification-button.component';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzPopoverModule } from 'ng-zorro-antd/popover';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { TranslocoModule } from "@jsverse/transloco";
import { SharedModule } from "../../shared/shared.module";
import { NotificationsListComponent } from './components/notifications-list/notifications-list.component';

@NgModule({
  declarations: [
    NotificationButtonComponent,
    NotificationsListComponent
  ],
  exports: [
    NotificationButtonComponent,
    NotificationsListComponent
  ],
  imports: [
    CommonModule,
    NzBadgeModule,
    NzButtonModule,
    NzIconModule,
    NzPopoverModule,
    NzCardModule,
    NzTableModule,
    NzTypographyModule,
    TranslocoModule,
    SharedModule
  ]
})
export class NotificationsModule {
}
