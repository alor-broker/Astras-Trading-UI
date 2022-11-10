import { NgModule } from '@angular/core';

import { TerminalSettingsRoutingModule } from './terminal-settings-routing.module';
import { TerminalSettingsWidgetComponent } from './widgets/terminal-settings-widget/terminal-settings-widget.component';
import { TerminalSettingsComponent } from './components/terminal-settings/terminal-settings.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { ExternalLinkModule } from '../../shared/components/external-link/external-link.module';


@NgModule({
  declarations: [
    TerminalSettingsWidgetComponent,
    TerminalSettingsComponent
  ],
    imports: [
        SharedModule,
        TerminalSettingsRoutingModule,
        ExternalLinkModule
    ],
  exports: [
    TerminalSettingsWidgetComponent
  ]
})
export class TerminalSettingsModule { }
