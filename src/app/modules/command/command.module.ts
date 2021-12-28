import { NgModule } from '@angular/core';

import { CommandRoutingModule } from './command-routing.module';
import { LimitCommandComponent } from './components/limit-command/limit-command.component';
import { LimitCommandWidgetComponent } from './widgets/limit-command-widget/limit-command-widget.component';
import { LimitCommandSettingsComponent } from './components/limit-command-settings/limit-command-settings.component';
import { SharedModule } from 'src/app/shared/shared.module';


@NgModule({
  declarations: [
    LimitCommandComponent,
    LimitCommandWidgetComponent,
    LimitCommandSettingsComponent
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
