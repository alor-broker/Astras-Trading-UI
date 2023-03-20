import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TreemapWidgetComponent } from './widgets/treemap-widget/treemap-widget.component';
import { TreemapComponent } from './components/treemap/treemap.component';
import { SharedModule } from "../../shared/shared.module";


@NgModule({
    declarations: [
        TreemapWidgetComponent,
        TreemapComponent
    ],
    exports: [
        TreemapWidgetComponent
    ],
  imports: [
    CommonModule,
    SharedModule
  ]
})
export class TreemapModule { }
