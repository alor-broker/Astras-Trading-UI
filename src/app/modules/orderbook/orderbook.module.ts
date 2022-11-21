import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { OrderbookRoutingModule } from './orderbook-routing.module';
import { OrderBookComponent } from './components/orderbook/orderbook.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { OrderbookSettingsComponent } from './components/orderbook-settings/orderbook-settings.component';
import { OrderbookWidgetComponent } from './widgets/orderbook-widget/orderbook-widget.component';
import { OrderbookChartComponent } from './components/orderbook-chart/orderbook-chart.component';
import { ScalperOrderBookWidgetComponent } from './widgets/scalper-order-book-widget/scalper-order-book-widget.component';
import { ScalperOrderBookComponent } from './components/scalper-order-book/scalper-order-book.component';
import { ScalperOrderBookSettingsComponent } from './components/scalper-order-book-settings/scalper-order-book-settings.component';
import { NzInputModule } from "ng-zorro-antd/input";


@NgModule({
  declarations: [
    OrderBookComponent,
    OrderbookSettingsComponent,
    OrderbookWidgetComponent,
    OrderbookChartComponent,
    ScalperOrderBookWidgetComponent,
    ScalperOrderBookComponent,
    ScalperOrderBookSettingsComponent,
  ],
    imports: [
        CommonModule,
        OrderbookRoutingModule,
        SharedModule,
        NzInputModule
    ],
  exports: [
    OrderbookWidgetComponent,
    ScalperOrderBookWidgetComponent
  ]
})
export class OrderbookModule {
}
