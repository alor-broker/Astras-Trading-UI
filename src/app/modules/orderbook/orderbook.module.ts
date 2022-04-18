import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { OrderbookRoutingModule } from './orderbook-routing.module';
import { OrderBookComponent } from './components/orderbook/orderbook.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { OrderbookSettingsComponent } from './components/orderbook-settings/orderbook-settings.component';
import { OrderbookWidgetComponent } from './widgets/orderbook-widget/orderbook-widget.component';
import { OrderbookChartComponent } from './components/orderbook-chart/orderbook-chart.component';


@NgModule({
  declarations: [
    OrderBookComponent,
    OrderbookSettingsComponent,
    OrderbookWidgetComponent,
    OrderbookChartComponent,
  ],
  imports: [
    CommonModule,
    OrderbookRoutingModule,
    SharedModule,
  ],
  exports: [
    OrderbookWidgetComponent
  ]
})
export class OrderbookModule {
}
