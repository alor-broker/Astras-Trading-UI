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


@NgModule({
  declarations: [
    ArbitrageSpreadWidgetComponent,
    ArbitrageSpreadTableComponent,
    ArbitrageSpreadModalWidgetComponent,
    ArbitrageSpreadManageComponent
  ],
  exports: [
    ArbitrageSpreadWidgetComponent,
    ArbitrageSpreadModalWidgetComponent
  ],
  imports: [
    CommonModule,
    SharedModule
  ]
})
export class ArbitrageSpreadModule {
}
