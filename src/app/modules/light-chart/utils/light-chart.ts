import * as LightweightCharts from 'lightweight-charts';
import { BusinessDay, LogicalRange, Time, UTCTimestamp } from 'lightweight-charts';
import { Observable, Subject } from 'rxjs';
import { distinct, map } from 'rxjs/operators';
import { LightChartSettings } from 'src/app/shared/models/settings/light-chart-settings.model';
import { Candle } from '../../../shared/models/history/candle.model';
import { TimeframesHelper, TimeframeValue } from './timeframes-helper';
import {
  buyColor,
  buyColorBackground,
  componentBackgound,
  sellColor,
  sellColorBackground
} from '../../../shared/models/settings/styles-constants';
import { TimezoneConverter } from '../../../shared/utils/timezone-converter';
import { fromUnixTime, toUnixTime } from '../../../shared/utils/datetime';
import { PriceFormatHelper } from "./price-format-helper";

type CandleDisplay = Candle & { time: Time };

export class LightChart {
  chart!: LightweightCharts.IChartApi;
  series!: LightweightCharts.ISeriesApi<'Candlestick'>;
  volumeSeries!: LightweightCharts.ISeriesApi<'Histogram'>;

  historyItemsCountToLoad$!: Observable<number>;

  private readonly logicalRange$ = new Subject<LogicalRange | null>();

  private bars: Candle[] = [];
  private sizes: {
    width: number,
    height: number
  };
  private historyPrevTime: number | null = null;
  private timezoneConverter?: TimezoneConverter;
  private currentTimeframe?: TimeframeValue;
  private maxTimeValue: number | null = null;

  constructor(width: number, height: number) {
    this.sizes = {
      width: width,
      height: height
    };
  }

  create(guid: string) {
    const chart = LightweightCharts.createChart(guid, {
      width: this.sizes.width,
      height: this.sizes.height,
      handleScale: {
        // axisPressedMouseMove: true,
      },
      timeScale: {
        timeVisible: true,
        borderColor: '#D1D4DC',
      },
      rightPriceScale: {
        autoScale: true,
        visible: true,
        borderColor: '#D1D4DC',
      },
      layout: {
        backgroundColor: componentBackgound, // '#ffffff',
        textColor: '#fff',
      },
      grid: {
        horzLines: {
          color: '#444', // '#F0F3FA',
        },
        vertLines: {
          color: '#444', // '#F0F3FA',
        },
      },
    });

    const series = chart.addCandlestickSeries({
      upColor: buyColor,
      downColor: sellColor,
      wickUpColor: buyColorBackground,
      wickDownColor: sellColorBackground,
      borderVisible: false,
      priceScaleId: 'right', // 'plot'
      scaleMargins: {
        top: 0,
        bottom: 0.25,
      },
    });

    const volumeSeries = chart.addHistogramSeries({
      color: '#26a69a',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: 'history',
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });

    volumeSeries.setData([]);
    series.setData([]);

    chart.timeScale().subscribeVisibleLogicalRangeChange(logicalRange => this.logicalRange$.next(logicalRange));

    this.historyItemsCountToLoad$ = this.logicalRange$.pipe(
      distinct(),
      map(logicalRange => {
        if (logicalRange !== null) {
          const barsInfo = series.barsInLogicalRange(logicalRange as any);
          if (barsInfo !== null && barsInfo.barsBefore < 0) {
            return Math.ceil(Math.abs(barsInfo.barsBefore));
          }
        }

        return 0;
      })
    );

    this.series = series;
    this.volumeSeries = volumeSeries;
    this.chart = chart;
  }

  update(candle: Candle) {
    if (candle) {
      if(this.maxTimeValue != null && candle.time < this.maxTimeValue) {
        this.aggregateHistoryData([candle]);
        return;
      }

      this.maxTimeValue = Math.max(this.maxTimeValue ?? -1, candle.time);
      const displayCandle = this.toDisplayCandle(candle);

      this.series.update(displayCandle as any);
      this.volumeSeries.update({
        time: displayCandle.time,
        value: displayCandle.volume,
        color:
          displayCandle.close > displayCandle.open
            ? buyColor
            : sellColor,
      } as any);

      this.bars.push(candle);
    }
  }

  setData(candles: Candle[], historyPrevTime: number | null) {
    this.aggregateHistoryData(candles);
    this.historyPrevTime = historyPrevTime;
  }

  aggregateHistoryData(candles: Candle[]) {
    const newBars = TimeframesHelper.aggregateBars(this.bars, candles, this.currentTimeframe ?? TimeframeValue.M1);
    this.maxTimeValue = Math.max(...newBars.map(x => x.time));
    const displayBars = newBars.map(candle => this.toDisplayCandle(candle));

    this.series.setData(displayBars as any);
    const volumes = displayBars.map(candle => ({
      time: candle.time,
      value: candle.volume,
      color:
        candle.close > candle.open
          ? buyColor
          : sellColor,
    }));
    this.volumeSeries.setData(volumes as any);

    this.bars = newBars;
  }

  clear() {
    this.chart.remove();
  }

  prepareSeries(timeframe: TimeframeValue, timezoneConverter: TimezoneConverter, minstep?: number) {
    this.historyPrevTime = null;
    this.maxTimeValue = null;
    this.bars = [];
    this.volumeSeries.setData([]);
    this.series.setData([]);

    this.currentTimeframe = timeframe;
    this.timezoneConverter = timezoneConverter;

    this.series.applyOptions({
      priceFormat: PriceFormatHelper.getPriceFormat(minstep ?? 1)
    });

    this.chart.priceScale().applyOptions({
      autoScale: true,
      scaleMargins: {
        top: 0,
        bottom: 0.2,
      }
    });

    this.chart.timeScale().fitContent();
  }

  checkMissingVisibleData() {
    this.logicalRange$.next(this.chart.timeScale().getVisibleLogicalRange());
  }

  resize(width: number, height: number) {
    this.sizes = {
      width: width,
      height: height
    };
    this.chart.resize(this.sizes.width, this.sizes.height);
  }

  getRequest(options: LightChartSettings, itemsCountToLoad: number) {
    const minTime = this.getMinTime();
    if (!options || minTime == Infinity) {
      return null;
    }

    return TimeframesHelper.getRequest(minTime, options, itemsCountToLoad, this.historyPrevTime);
  }

  private toDisplayCandle(candle: Candle): CandleDisplay {
    const candleDate = !!this.timezoneConverter
      ? this.timezoneConverter.toTerminalUtcDate(candle.time)
      : fromUnixTime(candle.time);

    let displayTime: Time = toUnixTime(candleDate) as UTCTimestamp;
    if (this.currentTimeframe === TimeframeValue.Month || this.currentTimeframe === TimeframeValue.Day) {
      displayTime = {
        year: candleDate.getFullYear(),
        month: candleDate.getMonth() + 1,
        day: candleDate.getDate()
      } as BusinessDay;
    }

    return {
      ...candle,
      time: displayTime
    } as CandleDisplay;
  }

  private getMinTime = () => Math.min(...this.bars.map(b => b.time));
}
