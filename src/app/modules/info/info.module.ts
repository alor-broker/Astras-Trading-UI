import { NgModule } from '@angular/core';
import { InfoWidgetComponent } from './widgets/info-widget/info-widget.component';
import { LetDirective } from "@ngrx/component";
import { BaseChartDirective } from "ng2-charts";
import { StockInfoComponent } from "./components/stocks/stock-info/stock-info.component";
import { BondInfoComponent } from "./components/bonds/bond-info/bond-info.component";
import { DerivativeInfoComponent } from "./components/derivatives/derivative-info/derivative-info.component";
import { CommonInfoComponent } from "./components/common/common-info/common-info.component";
import { NzSpinComponent } from "ng-zorro-antd/spin";
import { SharedModule } from "../../shared/shared.module";
import { InfoHeaderComponent } from "./components/common/info-header/info-header.component";

@NgModule({
  declarations: [
    InfoWidgetComponent,
  ],
  imports: [
    LetDirective,
    BaseChartDirective,
    StockInfoComponent,
    BondInfoComponent,
    DerivativeInfoComponent,
    CommonInfoComponent,
    NzSpinComponent,
    SharedModule,
    InfoHeaderComponent
  ],
  exports: [
    InfoWidgetComponent
  ]
})
export class InfoModule {
}
