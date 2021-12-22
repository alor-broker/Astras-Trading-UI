import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { OrderbookRoutingModule } from './orderbook-routing.module';
import { OrderBookComponent } from './components/order-book/order-book.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { OrderbookSettingsComponent } from './components/orderbook-settings/orderbook-settings.component';
import { OrderbookWidgetComponent } from './widgets/orderbook-widget/orderbook-widget.component';


@NgModule({
  declarations: [
    OrderBookComponent,
    OrderbookSettingsComponent,
    OrderbookWidgetComponent,
  ],
  imports: [
    CommonModule,
    OrderbookRoutingModule,
    SharedModule
  ],
  exports: [
    OrderbookWidgetComponent
  ]
})
export class OrderbookModule { }
