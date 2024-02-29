import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BondScreenerWidgetComponent } from './widgets/bond-screener-widget/bond-screener-widget.component';
import { BondScreenerComponent } from './components/bond-screener/bond-screener.component';
import { BondScreenerSettingsComponent } from './components/bond-screener-settings/bond-screener-settings.component';
import { SharedModule } from "../../shared/shared.module";
import { NzResizeObserverModule } from 'ng-zorro-antd/cdk/resize-observer';
import { YieldCurveChartComponent } from './components/yield-curve-chart/yield-curve-chart.component';
import { NzSpinModule } from "ng-zorro-antd/spin";
import { LetDirective } from "@ngrx/component";
import { YieldCurveChartParametersComponent } from './components/yield-curve-chart-parameters/yield-curve-chart-parameters.component';

@NgModule({
  declarations: [
    BondScreenerWidgetComponent,
    BondScreenerComponent,
    BondScreenerSettingsComponent,
    YieldCurveChartComponent,
    YieldCurveChartParametersComponent
  ],
  exports: [
    BondScreenerWidgetComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    NzResizeObserverModule,
    NzSpinModule,
    LetDirective
  ]
})
export class BondScreenerModule { }
