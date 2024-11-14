import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { OrderbookRoutingModule } from './orderbook-routing.module';
import { OrderBookComponent } from './components/orderbook/orderbook.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { OrderbookSettingsComponent } from './components/orderbook-settings/orderbook-settings.component';
import { OrderbookWidgetComponent } from './widgets/orderbook-widget/orderbook-widget.component';
import { OrderbookChartComponent } from './components/orderbook-chart/orderbook-chart.component';
import { NzInputModule } from "ng-zorro-antd/input";
import { DragDropModule } from '@angular/cdk/drag-drop';
import { NzResizeObserverModule } from 'ng-zorro-antd/cdk/resize-observer';
import { OrderbookTableVolumesAtTheEdgesComponent } from './components/orderbook-tables/orderbook-table-volumes-at-the-edges/orderbook-table-volumes-at-the-edges.component';
import { OrderbookTableVolumesAtTheMiddleComponent } from './components/orderbook-tables/orderbook-table-volumes-at-the-middle/orderbook-table-volumes-at-the-middle.component';
import { BaseChartDirective } from "ng2-charts";
import { NzSliderModule } from "ng-zorro-antd/slider";
import { WidgetSettingsComponent } from "../../shared/components/widget-settings/widget-settings.component";
import { InstrumentSearchComponent } from "../../shared/components/instrument-search/instrument-search.component";

@NgModule({
  declarations: [
    OrderBookComponent,
    OrderbookSettingsComponent,
    OrderbookWidgetComponent,
    OrderbookChartComponent,
    OrderbookTableVolumesAtTheEdgesComponent,
    OrderbookTableVolumesAtTheMiddleComponent
  ],
    imports: [
        CommonModule,
        OrderbookRoutingModule,
        SharedModule,
        NzInputModule,
        DragDropModule,
        NzResizeObserverModule,
        BaseChartDirective,
        NzSliderModule,
        WidgetSettingsComponent,
        InstrumentSearchComponent
    ],
  exports: [
    OrderbookWidgetComponent
  ]
})
export class OrderbookModule {
}
