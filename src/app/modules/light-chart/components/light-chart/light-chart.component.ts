import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { DashboardItem } from 'src/app/shared/models/dashboard-item.model';
import { Widget } from 'src/app/shared/models/widget.model';
import { LightChartSettings } from '../../../../shared/models/settings/light-chart-settings.model';
import * as LightweightCharts from 'lightweight-charts';
import { BehaviorSubject, bindCallback, from, fromEvent, interval, Observable, of, Subscription } from 'rxjs';
import { distinct, filter, map, mergeMap, switchMap, tap } from 'rxjs/operators';
import { LightChartService } from '../../services/light-chart.service';
import { Candle } from '../../models/candle.model';
import { GuidGenerator } from 'src/app/shared/utils/guid';
import { HistoryRequest } from '../../models/history-request.model';
import { addDays } from 'src/app/shared/utils/datetime';
import { findUnique } from 'src/app/shared/utils/collections';

@Component({
  selector: 'ats-light-chart[resize][widget]',
  templateUrl: './light-chart.component.html',
  styleUrls: ['./light-chart.component.sass'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class LightChartComponent implements OnInit, OnDestroy {
  @Input()
  shouldShowSettings!: boolean;
  @Input()
  widget!: Widget<LightChartSettings>;
  @Input()
  resize!: EventEmitter<DashboardItem>;
  @Input('settings') set settings(settings: LightChartSettings) {
    this.settings$.next(settings);
  }
  private settings$ = new BehaviorSubject<LightChartSettings | null>(null);
  @Output()
  shouldShowSettingsChange = new EventEmitter<boolean>();

  bars$: Observable<Candle | null> = of(null);
  resizeSub!: Subscription;
  guid: string | null = null;

  chart!: LightweightCharts.IChartApi;
  series!: LightweightCharts.ISeriesApi<'Candlestick'>;
  volumeSeries!: LightweightCharts.ISeriesApi<'Histogram'>;

  private bars: Candle[] = [];
  private getMinTime = () => Math.min(...this.bars.map(b => b.time));
  private getMaxTime = () => Math.max(...this.bars.map(b => b.time));
  private history$ = new Observable<void>();
  private historySub!: Subscription;
  private isUpdating = true;

  constructor(private service: LightChartService) {}

  ngOnInit(): void {
    this.guid = GuidGenerator.newGuid();
    this.bars$ = this.settings$.pipe(
      filter((s): s is LightChartSettings  => !!s),
      switchMap(s => this.service.getBars(s.symbol, s.exchange, s.timeFrame ?? 'D', s.from ?? 0))
    );
  }

  ngOnDestroy(): void {
    this.chart.remove();
    this.service.unsubscribe();
    this.history$
    this.resizeSub.unsubscribe();
  }

  ngAfterViewInit() {
    if (this.guid) {
      this.chart = this.getChart(this.guid);
      this.bars$.subscribe((candle) => {
        if (candle) {
          this.series.update(candle as any);
          const volume = {
            time: candle.time,
            value: candle.volume,
            color:
              candle.close > candle.open
                ? 'rgba(0, 150, 136, 0.8)'
                : 'rgba(255,82,82, 0.8)',
          };
          this.bars.push(candle);
          // this.volumeSeries.update(volume as any);
        }
      });
      setTimeout(() => {
        this.historySub = this.history$.subscribe()
        this.isUpdating = false;
      }, 2000);
      this.resizeSub = this.resize.subscribe((item) => {
        this.chart.resize(item.width ?? 0, (item.height ?? 0) - 30);
      });
    }
  }

  private getChart(guid: string) {
    const chart = LightweightCharts.createChart(guid, {
      width: 300,
      height: 300,
      timeScale: {
        timeVisible: true,
        borderColor: '#D1D4DC',
      },
      rightPriceScale: {
        borderColor: '#D1D4DC',
      },
      layout: {
        backgroundColor: '#ffffff',
        textColor: '#000',
      },
      grid: {
        horzLines: {
          color: '#F0F3FA',
        },
        vertLines: {
          color: '#F0F3FA',
        },
      },
    });
    var series = chart.addCandlestickSeries({
      upColor: 'rgb(38,166,154)',
      downColor: 'rgb(255,82,82)',
      wickUpColor: 'rgb(38,166,154)',
      wickDownColor: 'rgb(255,82,82)',
      borderVisible: false,
    });
    // var volumeSeries = chart.addHistogramSeries({
    //   color: '#26a69a',
    //   priceFormat: {
    //     type: 'volume',
    //   },
    //   priceScaleId: '',
    //   scaleMargins: {
    //     top: 0.8,
    //     bottom: 0,
    //   },
    // });
    // volumeSeries.setData([]);
    const getDate = (p: any) => {
      const d = new Date(p * 1000);
      return d.getDate() + '.' + d.getMonth() + '.' + d.getFullYear();
    }
    series.setData([]);
    this.history$ = new Observable(sub => {
      chart.timeScale().subscribeVisibleLogicalRangeChange(lrc => sub.next(lrc))
    }).pipe(
        distinct(),
        filter(_ => !this.isUpdating),
        map(logicalRange =>  {
          // var logicalRange = chart.timeScale().getVisibleLogicalRange();
          const options = this.settings$.getValue();
          const minTime = this.getMinTime();
          const maxTime = this.getMaxTime();
          if (logicalRange !== null && options && minTime != 0 && maxTime != 0) {
            var barsInfo = series.barsInLogicalRange(logicalRange as any);
            if (barsInfo !== null && barsInfo.barsBefore < 10) {
              // var firstTime = getBusinessDayBeforeCurrentAt(this.bars[0].time, 1);
              // var lastTime = getBusinessDayBeforeCurrentAt(firstTime, Math.max(100, -barsInfo.barsBefore + 100));
              var request : HistoryRequest = {
                from: addDays(new Date(minTime * 1000), -100).getTime() / 1000,
                to: minTime,
                tf: options.timeFrame,
                code: options.symbol,
                exchange: options.exchange
              };
              return request;
            }
          }
          return null;
        }),
        filter((r): r is HistoryRequest => !!r && !this.isUpdating),
        mergeMap(r => {
          this.isUpdating = true;
          console.log(this.isUpdating)
          return this.service.getHistory(r);
        }),
        map(res => {
          const newBars = findUnique([...this.bars, ...res.history], (c => c))
          series.setData(newBars as any);
          this.bars = newBars;
          this.isUpdating = false;
          console.log(this.isUpdating)
        })
    );
    this.series = series;
    // this.volumeSeries = volumeSeries;

    return chart;
  }
}
