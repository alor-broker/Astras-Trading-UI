import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { InstrumentsRoutingModule } from './instruments-routing.module';
import { InstrumentSelectComponent } from './components/instrument-select/instrument-select.component';
import { InstrumentSelectWidgetComponent } from './widgets/instrument-select-widget/instrument-select-widget.component';
import { InstrumentSelectSettingsComponent } from './components/instrument-select-settings/instrument-select-settings.component';
import { SharedModule } from 'src/app/shared/shared.module';


@NgModule({
  declarations: [
    InstrumentSelectComponent,
    InstrumentSelectWidgetComponent,
    InstrumentSelectSettingsComponent
  ],
  imports: [
    SharedModule,
    InstrumentsRoutingModule
  ],
  exports: [
    InstrumentSelectWidgetComponent
  ]
})
export class InstrumentsModule { }
