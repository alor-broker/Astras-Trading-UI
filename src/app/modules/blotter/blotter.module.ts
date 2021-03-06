import { NgModule } from '@angular/core';
import { BlotterRoutingModule } from './blotter-routing.module';
import { BlotterWidgetComponent } from './widgets/blotter-widget/blotter-widget.component';
import { PositionsComponent } from './components/positions/positions.component';
import { TradesComponent } from './components/trades/trades.component';
import { OrdersComponent } from './components/orders/orders.component';
import { BlotterSettingsComponent } from './components/blotter-settings/blotter-settings.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { CommonSummaryComponent } from './components/common-summary/common-summary.component';
import { StopOrdersComponent } from './components/stop-orders/stop-orders.component';
import { ForwardSummaryComponent } from './components/forward-summary/forward-summary.component';


@NgModule({
  declarations: [
    BlotterWidgetComponent,
    PositionsComponent,
    TradesComponent,
    OrdersComponent,
    StopOrdersComponent,
    BlotterSettingsComponent,
    CommonSummaryComponent,
    ForwardSummaryComponent
  ],
  imports: [
    SharedModule,
    BlotterRoutingModule
  ],
  exports: [
    BlotterWidgetComponent
  ]
})
export class BlotterModule { }
