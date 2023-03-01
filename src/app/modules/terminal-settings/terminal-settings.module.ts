import { NgModule } from '@angular/core';

import { TerminalSettingsRoutingModule } from './terminal-settings-routing.module';
import { TerminalSettingsWidgetComponent } from './widgets/terminal-settings-widget/terminal-settings-widget.component';
import { TerminalSettingsComponent } from './components/terminal-settings/terminal-settings.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { ExternalLinkModule } from '../../shared/components/external-link/external-link.module';
import { NzInputModule } from "ng-zorro-antd/input";
import { InstantNotificationsFormComponent } from './components/instant-notifications-form/instant-notifications-form.component';
import { NzDividerModule } from 'ng-zorro-antd/divider';


@NgModule({
  declarations: [
    TerminalSettingsWidgetComponent,
    TerminalSettingsComponent,
    InstantNotificationsFormComponent
  ],
    imports: [
        SharedModule,
        TerminalSettingsRoutingModule,
        ExternalLinkModule,
        NzInputModule,
        NzDividerModule
    ],
  exports: [
    TerminalSettingsWidgetComponent
  ]
})
export class TerminalSettingsModule { }
