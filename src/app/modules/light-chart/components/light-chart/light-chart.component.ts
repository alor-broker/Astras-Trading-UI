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
import { BehaviorSubject, Observable, of, Subscription } from 'rxjs';
import { distinct, filter, switchMap, tap } from 'rxjs/operators';
import { LightChartService } from '../../services/light-chart.service';
import { Candle } from '../../models/candle.model';
import { GuidGenerator } from 'src/app/shared/utils/guid';

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

  constructor(private service: LightChartService) {}

  ngOnInit(): void {
    this.guid = GuidGenerator.newGuid();
    this.bars$ = this.settings$.pipe(
      filter((s): s is LightChartSettings  => !!s),
      switchMap(s => this.service.getBars(s.symbol, s.exchange))
    );
  }

  ngOnDestroy(): void {
    this.chart.remove();
    this.service.unsubscribe();
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
          this.volumeSeries.update(volume as any);
        }
      });

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
    var volumeSeries = chart.addHistogramSeries({
      color: '#26a69a',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '',
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });
    volumeSeries;
    series.setData([]);
    volumeSeries.setData([]);
    this.series = series;
    this.volumeSeries = volumeSeries;

    // var datesForMarkers = [data[data.length - 19], data[data.length - 39]];
    // var indexOfMinPrice = 0;
    // for (var i = 1; i < datesForMarkers.length; i++) {
    //   if (datesForMarkers[i].high < datesForMarkers[indexOfMinPrice].high) {
    //     indexOfMinPrice = i;
    //   }
    // }
    // var markers = [];
    // for (var i = 0; i < datesForMarkers.length; i++) {
    //   if (i !== indexOfMinPrice) {
    //     markers.push({
    //       time: datesForMarkers[i].time,
    //       position: 'aboveBar',
    //       color: '#e91e63',
    //       shape: 'arrowDown',
    //       text: 'Sell @ ' + Math.floor(datesForMarkers[i].high + 2),
    //     });
    //   } else {
    //     markers.push({
    //       time: datesForMarkers[i].time,
    //       position: 'belowBar',
    //       color: '#2196F3',
    //       shape: 'arrowUp',
    //       text: 'Buy @ ' + Math.floor(datesForMarkers[i].low - 2),
    //     });
    //   }
    // }
    // markers.push({
    //   time: data[data.length - 48].time,
    //   position: 'aboveBar',
    //   color: '#f68410',
    //   shape: 'circle',
    //   text: 'D',
    // });
    // series.setMarkers(markers as any);
    return chart;
  }
}
