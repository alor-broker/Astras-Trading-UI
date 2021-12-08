import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { DashboardPageComponent } from './pages/dashboard-page/dashboard-page.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { NavbarComponent } from './components/navbar/navbar.component';
import { OrderBookComponent } from './components/order-book/order-book.component';
import { ParentWidgetComponent } from './components/parent-widget/parent-widget.component';
import { TradingChartComponent } from './components/trading-chart/trading-chart.component';

@NgModule({
  declarations: [
    DashboardPageComponent,
    DashboardComponent,
    NavbarComponent,
    OrderBookComponent,
    ParentWidgetComponent,
    TradingChartComponent
  ],
  imports: [
    CommonModule,
    DashboardRoutingModule,
    SharedModule,
    // components
  ]
})
export class DashboardModule { }
