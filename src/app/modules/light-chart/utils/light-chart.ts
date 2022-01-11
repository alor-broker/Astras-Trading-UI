import * as LightweightCharts from 'lightweight-charts';
import { Observable } from 'rxjs';
import { distinct, filter, map } from 'rxjs/operators';
import { LightChartSettings } from 'src/app/shared/models/settings/light-chart-settings.model';
import { Candle } from '../../../shared/models/history/candle.model';
import { TimeframesHelper } from './timeframes-helper';

export class LightChart {
  chart!: LightweightCharts.IChartApi;
  series!: LightweightCharts.ISeriesApi<'Candlestick'>;
  volumeSeries!: LightweightCharts.ISeriesApi<'Histogram'>;

  logicalRange$!: Observable<unknown>;

  private bars: Candle[] = [];
  private getMinTime = () => Math.min(...this.bars.map(b => b.time));
  private timeframesHelper = new TimeframesHelper()

  create(guid: string) {
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
    volumeSeries.setData([]);
    series.setData([]);
    this.logicalRange$ = new Observable(sub => {
      chart.timeScale().subscribeVisibleLogicalRangeChange(lrc => sub.next(lrc))
    }).pipe(
        distinct(),
        map(logicalRange => {
          if (logicalRange !== null) {
            var barsInfo = series.barsInLogicalRange(logicalRange as any);
            if (barsInfo !== null && barsInfo.barsBefore < 10) {
              return logicalRange;
            }
          }
          return null;
        })
      )

      this.series = series;
      this.volumeSeries = volumeSeries;
      this.chart = chart;
  }

  update(candle: Candle) {
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
      this.volumeSeries.update(volume as any);
  }
}
setData(candles: Candle[], options: LightChartSettings) {
  const newBars = this.timeframesHelper.aggregateBars(this.bars, candles, options);
  this.series.setData(newBars as any);
  const volumes = newBars.map(candle => ({
    time: candle.time,
    value: candle.volume,
    color:
      candle.close > candle.open
        ? 'rgba(0, 150, 136, 0.8)'
        : 'rgba(255,82,82, 0.8)',
  }))
  this.volumeSeries.setData(volumes as any);
  this.bars = newBars;
}

  clear() {
    this.chart.remove();
  }

  resize(width: number, height: number) {
    this.chart.resize(width, (height) - 30);
  }

  getRequest(options: LightChartSettings) {
    return this.timeframesHelper.getRequest(this.getMinTime(), options);
  }
}
