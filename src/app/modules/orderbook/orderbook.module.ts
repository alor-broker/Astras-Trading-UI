import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { OrderbookRoutingModule } from './orderbook-routing.module';
import { OrderBookComponent } from './components/orderbook/orderbook.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { OrderbookSettingsComponent } from './components/orderbook-settings/orderbook-settings.component';
import { OrderbookWidgetComponent } from './widgets/orderbook-widget/orderbook-widget.component';
import { OrderbookChartComponent } from './components/orderbook-chart/orderbook-chart.component';
import { StoreModule } from '@ngrx/store';
import { State } from 'src/app/shared/ngrx/state';
import { syncReducer } from 'src/app/shared/ngrx/reducers/sync.reducer';


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
    StoreModule.forFeature<State>('sync', { sync: syncReducer })
  ],
  exports: [
    OrderbookWidgetComponent
  ]
})
export class OrderbookModule { }
