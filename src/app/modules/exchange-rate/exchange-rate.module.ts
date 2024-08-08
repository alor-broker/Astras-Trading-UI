import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExchangeRateComponent } from './components/exchange-rate/exchange-rate.component';
import { ExchangeRateWidgetComponent } from './widgets/exchange-rate-widget/exchange-rate-widget.component';
import { SharedModule } from "../../shared/shared.module";
import {NzResizeObserverModule} from "ng-zorro-antd/cdk/resize-observer";

@NgModule({
  declarations: [
    ExchangeRateComponent,
    ExchangeRateWidgetComponent,
  ],
  exports: [
    ExchangeRateWidgetComponent
  ],
    imports: [
        CommonModule,
        SharedModule,
        NzResizeObserverModule
    ]
})
export class ExchangeRateModule {
}
