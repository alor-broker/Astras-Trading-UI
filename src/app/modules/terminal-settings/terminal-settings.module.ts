import { NgModule } from '@angular/core';

import { TerminalSettingsRoutingModule } from './terminal-settings-routing.module';
import { TerminalSettingsWidgetComponent } from './widgets/terminal-settings-widget/terminal-settings-widget.component';
import { TerminalSettingsComponent } from './components/terminal-settings/terminal-settings.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { ExternalLinkModule } from '../../shared/components/external-link/external-link.module';
import { NzInputModule } from "ng-zorro-antd/input";
import { InstantNotificationsFormComponent } from './components/instant-notifications-form/instant-notifications-form.component';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { UsefulLinksComponent } from './components/useful-links/useful-links.component';
import { HotKeySettingsFormComponent } from './components/hot-key-settings-form/hot-key-settings-form.component';
import { PortfoliosCurrencyFormComponent } from './components/portfolios-currency-form/portfolios-currency-form.component';
import { GeneralSettingsFormComponent } from './components/general-settings-form/general-settings-form.component';
import { ScalperMouseActionsFormComponent } from './components/scalper-mouse-actions-form/scalper-mouse-actions-form.component';
import { HotKeyInputComponent } from './components/hot-key-input/hot-key-input.component';


@NgModule({
  declarations: [
    TerminalSettingsWidgetComponent,
    TerminalSettingsComponent,
    InstantNotificationsFormComponent,
    UsefulLinksComponent,
    HotKeySettingsFormComponent,
    PortfoliosCurrencyFormComponent,
    GeneralSettingsFormComponent,
    ScalperMouseActionsFormComponent,
    HotKeyInputComponent
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
export class TerminalSettingsModule {
}
