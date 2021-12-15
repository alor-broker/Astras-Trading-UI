import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { OrderbookRoutingModule } from './orderbook-routing.module';
import { OrderBookComponent } from './components/order-book/order-book.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { OrderbookSettingsComponent } from './components/orderbook-settings/orderbook-settings.component';


@NgModule({
  declarations: [
    OrderBookComponent,
    OrderbookSettingsComponent,
  ],
  imports: [
    CommonModule,
    OrderbookRoutingModule,
    SharedModule
  ],
  exports: [
    OrderBookComponent,
    // OrderbookSettingsComponent,
  ]
})
export class OrderbookModule { }
