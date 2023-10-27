import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InstrumentsCorrelationWidgetComponent } from './widgets/instruments-correlation-widget/instruments-correlation-widget.component';
import { CorrelationChartComponent } from './components/correlation-chart/correlation-chart.component';
import { SharedModule } from "../../shared/shared.module";
import { TranslocoModule } from "@ngneat/transloco";
import { NzResizeObserverModule } from "ng-zorro-antd/cdk/resize-observer";
import { LetDirective } from "@ngrx/component";
import { NzSpinModule } from "ng-zorro-antd/spin";



@NgModule({
  declarations: [
    InstrumentsCorrelationWidgetComponent,
    CorrelationChartComponent
  ],
  exports: [
    InstrumentsCorrelationWidgetComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    TranslocoModule,
    NzResizeObserverModule,
    LetDirective,
    NzSpinModule
  ]
})
export class InstrumentsCorrelationModule { }
