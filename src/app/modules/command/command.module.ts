import { NgModule } from '@angular/core';

import { CommandRoutingModule } from './command-routing.module';
import { LimitCommandComponent } from './components/limit/limit-command.component';
import { LimitCommandWidgetComponent } from './widgets/limit-command-widget/limit-command-widget.component';
import { LimitCommandSettingsComponent } from './components/limit-command-settings/limit-command-settings.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { CommandHeaderComponent } from './components/command-header/command-header.component';
import { CommandFooterComponent } from './components/command-footer/command-footer.component';


@NgModule({
  declarations: [
    LimitCommandComponent,
    LimitCommandWidgetComponent,
    LimitCommandSettingsComponent,
    CommandHeaderComponent,
    CommandFooterComponent
  ],
  imports: [
    SharedModule,
    CommandRoutingModule
  ],
  exports: [
    LimitCommandWidgetComponent
  ]
})
export class CommandModule { }
