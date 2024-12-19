import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ArbitrageSpreadWidgetComponent
} from './widgets/arbitrage-spread-widget/arbitrage-spread-widget.component';
import { SharedModule } from "../../shared/shared.module";
import {
  ArbitrageSpreadModalWidgetComponent
} from './widgets/arbitrage-spread-modal-widget/arbitrage-spread-modal-widget.component';
import {
  ArbitrageSpreadTableComponent
} from "./components/arbitrage-spread-table/arbitrage-spread-table.component";
import {
  ArbitrageSpreadManageComponent
} from './components/arbitrage-spread-manage/arbitrage-spread-manage.component';
import { SpreadLegComponent } from './components/spread-leg/spread-leg.component';
import { InstrumentSearchComponent } from "../../shared/components/instrument-search/instrument-search.component";
import { InputNumberComponent } from "../../shared/components/input-number/input-number.component";
import { ArbitrageSpreadService } from "./services/arbitrage-spread.service";
import { TableRowHeightDirective } from "../../shared/directives/table-row-height.directive";

@NgModule({
  declarations: [
    ArbitrageSpreadWidgetComponent,
    ArbitrageSpreadTableComponent,
    ArbitrageSpreadModalWidgetComponent,
    ArbitrageSpreadManageComponent,
    SpreadLegComponent
  ],
  exports: [
    ArbitrageSpreadWidgetComponent,
    ArbitrageSpreadModalWidgetComponent
  ],
    imports: [
        CommonModule,
        SharedModule,
        InstrumentSearchComponent,
        InputNumberComponent,
        TableRowHeightDirective
    ],
  providers:[
    ArbitrageSpreadService
  ]
})
export class ArbitrageSpreadModule {
}
