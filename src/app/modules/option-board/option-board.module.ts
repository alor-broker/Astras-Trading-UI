import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OptionBoardWidgetComponent } from './widgets/option-board-widget/option-board-widget.component';
import { OptionBoardComponent } from './components/option-board/option-board.component';
import { OptionBoardSettingsComponent } from './components/option-board-settings/option-board-settings.component';
import { SharedModule } from "../../shared/shared.module";
import { TranslocoModule } from "@jsverse/transloco";
import { NzSpinModule } from "ng-zorro-antd/spin";
import { AllOptionsComponent } from './components/all-options/all-options.component';
import { SelectedOptionsComponent } from './components/selected-options/selected-options.component';
import { OptionBoardService } from "./services/option-board.service";
import { NzResizeObserverModule } from "ng-zorro-antd/cdk/resize-observer";
import { OptionPreviewComponent } from "./components/option-preview/option-preview.component";
import {
  CdkDrag,
  CdkDropList
} from "@angular/cdk/drag-drop";
import { LetDirective } from "@ngrx/component";
import { OptionBoardChartsLayoutComponent } from "./components/option-board-charts-layout/option-board-charts-layout.component";
import { OptionBoardChartComponent } from "./components/option-board-chart/option-board-chart.component";
import { BaseChartDirective } from "ng2-charts";
import { NzAlertComponent } from "ng-zorro-antd/alert";
import { InstrumentsModule } from "../instruments/instruments.module";
import { InputNumberComponent } from "../../shared/components/input-number/input-number.component";
import { WidgetSettingsComponent } from "../../shared/components/widget-settings/widget-settings.component";
import { InstrumentSearchComponent } from "../../shared/components/instrument-search/instrument-search.component";
import { TableRowHeightDirective } from "../../shared/directives/table-row-height.directive";
import { AllOptionsListViewComponent } from "./components/all-options-list-view/all-options-list-view.component";
import { ViewSelectorComponent } from "./components/view-selector/view-selector.component";
import { ViewSelectorItemComponent } from "./components/view-selector-item/view-selector-item.component";

@NgModule({
  declarations: [
    OptionBoardWidgetComponent,
    OptionBoardComponent,
    OptionBoardSettingsComponent,
    AllOptionsComponent,
    SelectedOptionsComponent,
    OptionPreviewComponent,
    OptionBoardChartsLayoutComponent,
    OptionBoardChartComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    TranslocoModule,
    NzSpinModule,
    NzResizeObserverModule,
    CdkDrag,
    CdkDropList,
    LetDirective,
    BaseChartDirective,
    NzAlertComponent,
    InstrumentsModule,
    InputNumberComponent,
    WidgetSettingsComponent,
    InstrumentSearchComponent,
    TableRowHeightDirective,
    AllOptionsListViewComponent,
    ViewSelectorComponent,
    ViewSelectorItemComponent
  ],
  exports: [
    OptionBoardWidgetComponent
  ],
  providers: [
    OptionBoardService
  ]
})
export class OptionBoardModule {
}
