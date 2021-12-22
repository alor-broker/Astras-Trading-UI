import { Component, EventEmitter, Input, OnInit } from '@angular/core';
import { DashboardItem } from 'src/app/shared/models/dashboard-item.model';
import { Widget } from 'src/app/shared/models/widget.model';
import { LightChartSettings } from '../../../../shared/models/settings/light-chart-settings.model';
declare const TradingView: any;

@Component({
  selector: 'ats-light-chart',
  templateUrl: './light-chart.component.html',
  styleUrls: ['./light-chart.component.sass']
})
export class LightChartComponent implements OnInit {

  private tradingView: any;

  @Input()
  widget! : Widget<LightChartSettings>;
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
