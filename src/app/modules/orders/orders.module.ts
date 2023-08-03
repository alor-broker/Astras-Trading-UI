import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrdersDialogComponent } from './widgets/orders-dialog/orders-dialog.component';
import { OrdersDialogWidgetComponent } from './widgets/orders-dialog-widget/orders-dialog-widget.component';
import { BuySellButtonsComponent } from './components/buy-sell-buttons/buy-sell-buttons.component';
import { CompactHeaderComponent } from './components/compact-header/compact-header.component';
import { InstrumentInfoComponent } from './components/instrument-info/instrument-info.component';
import { OrderEvaluationComponent } from './components/order-evaluation/order-evaluation.component';
import { LimitOrderFormComponent } from './components/order-forms/limit-order-form/limit-order-form.component';
import { MarketOrderFormComponent } from './components/order-forms/market-order-form/market-order-form.component';
import { StopOrderFormComponent } from './components/order-forms/stop-order-form/stop-order-form.component';



@NgModule({
  declarations: [
    OrdersDialogComponent,
    OrdersDialogWidgetComponent,
    BuySellButtonsComponent,
    CompactHeaderComponent,
    InstrumentInfoComponent,
    OrderEvaluationComponent,
    LimitOrderFormComponent,
    MarketOrderFormComponent,
    StopOrderFormComponent
  ],
  imports: [
    CommonModule
  ]
})
export class OrdersModule { }
