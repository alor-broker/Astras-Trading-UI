import { Component, OnInit, AfterViewInit, EventEmitter, Input } from '@angular/core';
import { GridsterItem } from 'angular-gridster2';
import { DashboardItem } from 'src/app/shared/models/dashboard-item.model';
import { Widget } from 'src/app/shared/models/widget.model';
import { TradingviewChartSettings } from '../../models/tradingview-chart-settings.model';
declare const TradingView: any;
@Component({
  selector: 'ats-trading-chart',
  templateUrl: './trading-chart.component.html',
  styleUrls: ['./trading-chart.component.scss'],
})
export class TradingChartComponent implements OnInit {

  private tradingView: any;

  @Input()
  widget! : Widget<TradingviewChartSettings>;
  @Input()
  resize!: EventEmitter<DashboardItem>;

  constructor() {}

  ngOnInit(): void {
  }

  ngAfterViewInit() {
    this.tradingView = new TradingView.widget({
      width: '100%',
      height: '550px',
      symbol: 'BINANCE:BTCUSDT',
      theme: 'dark',
      allow_symbol_change: true,
      container_id: 'tradingview_3462e',
    });
  }
}
