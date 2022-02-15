import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { NavbarComponent } from './components/navbar/navbar.component';
import { ParentWidgetComponent } from './components/parent-widget/parent-widget.component';
import { WidgetHeaderComponent } from './components/widget-header/widget-header.component';
import { OrderbookModule } from '../orderbook/orderbook.module';
import { DashboardWidgetComponent } from './widgets/dashboard-widget/dashboard-widget.component';
import { LightChartModule } from '../light-chart/light-chart.module';
import { InstrumentsModule } from '../instruments/instruments.module';
import { BlotterModule } from '../blotter/blotter.module';
import { CommandModule } from '../command/command.module';
import { HelpModule } from '../help/help.module';
import { InfoModule } from '../info/info.module';
import { TerminalSettingsModule } from '../terminal-settings/terminal-settings.module';

@NgModule({
  declarations: [
    DashboardWidgetComponent,
    DashboardComponent,
    NavbarComponent,
    ParentWidgetComponent,
    WidgetHeaderComponent,
  ],
  imports: [
    DashboardRoutingModule,
    SharedModule,
    OrderbookModule,
    LightChartModule,
    InstrumentsModule,
    BlotterModule,
    CommandModule,
    HelpModule,
    InfoModule,
    TerminalSettingsModule,
    // components
  ]
})
export class DashboardModule { }
