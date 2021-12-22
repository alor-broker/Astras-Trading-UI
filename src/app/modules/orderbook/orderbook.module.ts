import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { OrderbookRoutingModule } from './orderbook-routing.module';
import { OrderBookComponent } from './components/order-book/order-book.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { OrderbookSettingsComponent } from './components/orderbook-settings/orderbook-settings.component';
import { OrderbookPageComponent } from './pages/orderbook-page/orderbook-page.component';


@NgModule({
  declarations: [
    OrderBookComponent,
    OrderbookSettingsComponent,
    OrderbookPageComponent,
  ],
  imports: [
    CommonModule,
    OrderbookRoutingModule,
    SharedModule
  ],
  exports: [
    OrderbookPageComponent
  ]
})
export class OrderbookModule { }
