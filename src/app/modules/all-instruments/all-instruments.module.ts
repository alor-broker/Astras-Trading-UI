import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AllInstrumentsComponent } from './components/all-instruments/all-instruments.component';
import { AllInstrumentsWidgetComponent } from './widgets/all-instruments-widget/all-instruments-widget.component';
import { SharedModule } from "../../shared/shared.module";
import { AllInstrumentsSettingsComponent } from './components/all-instruments-settings/all-instruments-settings.component';
import { NzResizeObserverModule } from 'ng-zorro-antd/cdk/resize-observer';
import { LetDirective } from "@ngrx/component";

@NgModule({
  declarations: [
    AllInstrumentsComponent,
    AllInstrumentsWidgetComponent,
    AllInstrumentsSettingsComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    NzResizeObserverModule,
    LetDirective
  ],
  exports: [
    AllInstrumentsWidgetComponent
  ]
})
export class AllInstrumentsModule {
}
