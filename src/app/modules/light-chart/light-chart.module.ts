import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LightChartRoutingModule } from './light-chart-routing.module';
import { LightChartComponent } from './components/light-chart/light-chart.component';
import { LightChartWidgetComponent } from './widgets/light-chart-widget/light-chart-widget.component';


@NgModule({
  declarations: [
    LightChartComponent,
    LightChartWidgetComponent
  ],
  imports: [
    CommonModule,
    LightChartRoutingModule
  ],
  exports: [
    LightChartWidgetComponent
  ]
})
export class LightChartModule { }
