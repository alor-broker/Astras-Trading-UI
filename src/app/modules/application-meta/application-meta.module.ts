import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NOTIFICATIONS_PROVIDER } from '../notifications/services/notifications-provider';
import { ApplicationReleaseNotificationProvider } from './services/application-release-notification-provider';
import { ApplicationUpdatedWidgetComponent } from './widgets/application-updated-widget/application-updated-widget.component';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzWaveModule } from 'ng-zorro-antd/core/wave';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzIconModule } from 'ng-zorro-antd/icon';


@NgModule({
  declarations: [
    ApplicationUpdatedWidgetComponent
  ],
  imports: [
    CommonModule,
    NzModalModule,
    NzWaveModule,
    NzButtonModule,
    NzTypographyModule,
    NzIconModule
  ],
  exports: [
    ApplicationUpdatedWidgetComponent
  ],
  providers: [
    { provide: NOTIFICATIONS_PROVIDER, useClass: ApplicationReleaseNotificationProvider, multi: true }
  ]
})
export class ApplicationMetaModule {
}
