import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TreemapWidgetComponent } from './widgets/treemap-widget/treemap-widget.component';
import { TreemapComponent } from './components/treemap/treemap.component';
import { SharedModule } from "../../shared/shared.module";
import { TreemapSettingsComponent } from './components/treemap-settings/treemap-settings.component';
import { NzSliderModule } from "ng-zorro-antd/slider";
import { WidgetSettingsComponent } from "../../shared/components/widget-settings/widget-settings.component";

@NgModule({
    declarations: [
        TreemapWidgetComponent,
        TreemapComponent,
        TreemapSettingsComponent
    ],
    exports: [
        TreemapWidgetComponent
    ],
  imports: [
    CommonModule,
    SharedModule,
    NzSliderModule,
    WidgetSettingsComponent
  ]
})
export class TreemapModule { }
