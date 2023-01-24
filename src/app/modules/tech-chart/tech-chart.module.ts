import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TechChartWidgetComponent } from './widgets/tech-chart-widget/tech-chart-widget.component';
import { TechChartComponent } from './components/tech-chart/tech-chart.component';
import { TechChartSettingsComponent } from './components/tech-chart-settings/tech-chart-settings.component';
import { NzFormModule } from "ng-zorro-antd/form";
import { ReactiveFormsModule } from "@angular/forms";
import { NzCollapseModule } from "ng-zorro-antd/collapse";
import { NzButtonModule } from "ng-zorro-antd/button";
import { NzInputModule } from "ng-zorro-antd/input";
import { NzSelectModule } from "ng-zorro-antd/select";
import { SharedModule } from '../../shared/shared.module';
import { NzResizeObserverModule } from 'ng-zorro-antd/cdk/resize-observer';


@NgModule({
  declarations: [
    TechChartWidgetComponent,
    TechChartComponent,
    TechChartSettingsComponent
  ],
    imports: [
        CommonModule,
        NzFormModule,
        ReactiveFormsModule,
        NzCollapseModule,
        NzButtonModule,
        NzInputModule,
        NzSelectModule,
        SharedModule,
        NzResizeObserverModule
    ],
  exports: [
    TechChartWidgetComponent
  ]
})
export class TechChartModule {
}
