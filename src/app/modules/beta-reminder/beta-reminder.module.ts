import { NgModule } from '@angular/core';

import { BetaReminderRoutingModule } from './beta-reminder-routing.module';
import { BetaReminderComponent } from './components/beta-reminder/beta-reminder.component';
import { BetaReminderWidgetComponent } from './widgets/beta-reminder-widget/beta-reminder-widget.component';
import { SharedModule } from 'src/app/shared/shared.module';


@NgModule({
  declarations: [
    BetaReminderComponent,
    BetaReminderWidgetComponent
  ],
  imports: [
    SharedModule,
    BetaReminderRoutingModule
  ],
  exports: [
    BetaReminderWidgetComponent
  ]
})
export class BetaReminderModule { }
