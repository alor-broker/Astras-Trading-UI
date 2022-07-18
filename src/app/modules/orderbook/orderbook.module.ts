import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { OrderbookRoutingModule } from './orderbook-routing.module';
import { OrderBookComponent } from './components/orderbook/orderbook.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { OrderbookSettingsComponent } from './components/orderbook-settings/orderbook-settings.component';
import { OrderbookWidgetComponent } from './widgets/orderbook-widget/orderbook-widget.component';
import { OrderbookChartComponent } from './components/orderbook-chart/orderbook-chart.component';
import { VerticalOrderBookWidgetComponent } from './widgets/vertical-order-book-widget/vertical-order-book-widget.component';
import { VerticalOrderBookComponent } from './components/vertical-order-book/vertical-order-book.component';
import { VerticalOrderBookSettingsComponent } from './components/vertical-order-book-settings/vertical-order-book-settings.component';


@NgModule({
  declarations: [
    OrderBookComponent,
    OrderbookSettingsComponent,
    OrderbookWidgetComponent,
    OrderbookChartComponent,
    VerticalOrderBookWidgetComponent,
    VerticalOrderBookComponent,
    VerticalOrderBookSettingsComponent,
  ],
  imports: [
    CommonModule,
    OrderbookRoutingModule,
    SharedModule
  ],
  exports: [
    OrderbookWidgetComponent,
    VerticalOrderBookWidgetComponent
  ]
})
export class OrderbookModule {
}
