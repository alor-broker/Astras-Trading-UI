import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationButtonComponent } from './components/notification-button/notification-button.component';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';



@NgModule({
  declarations: [
    NotificationButtonComponent
  ],
  exports: [
    NotificationButtonComponent
  ],
  imports: [
    CommonModule,
    NzBadgeModule,
    NzButtonModule,
    NzIconModule
  ]
})
export class NotificationsModule { }
