import { NgModule } from '@angular/core';

import { LightChartRoutingModule } from './light-chart-routing.module';
import { LightChartComponent } from './components/light-chart/light-chart.component';
import { LightChartWidgetComponent } from './widgets/light-chart-widget/light-chart-widget.component';
import { LightChartSettingsComponent } from './components/light-chart-settings/light-chart-settings.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzResizeObserverModule } from 'ng-zorro-antd/cdk/resize-observer';
import { LetDirective } from "@ngrx/component";
import { TimeframesPanelComponent } from './components/timeframes-panel/timeframes-panel.component';
import { WidgetSettingsComponent } from "../../shared/components/widget-settings/widget-settings.component";
import { InstrumentSearchComponent } from "../../shared/components/instrument-search/instrument-search.component";

@NgModule({
  declarations: [
    LightChartComponent,
    LightChartSettingsComponent,
    LightChartWidgetComponent,
    TimeframesPanelComponent,
  ],
    imports: [
        SharedModule,
        LightChartRoutingModule,
        NzInputModule,
        NzResizeObserverModule,
        LetDirective,
        WidgetSettingsComponent,
        InstrumentSearchComponent
    ],
  exports: [
    LightChartWidgetComponent
  ]
})
export class LightChartModule { }
