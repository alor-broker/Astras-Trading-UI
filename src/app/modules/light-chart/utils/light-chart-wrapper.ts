import {
  HistoryMetadata,
  LightChartConfig,
  TimeframeValue
} from '../models/light-chart.models';
import {
  BusinessDay,
  ChartOptions,
  ColorType,
  createChart,
  CrosshairMode,
  DeepPartial,
  HistogramData,
  IChartApi,
  ISeriesApi,
  LogicalRange,
  Time,
  UTCTimestamp
} from 'lightweight-charts';
import { Candle } from '../../../shared/models/history/candle.model';
import { TimeframesHelper } from './timeframes-helper';
import { PriceFormatHelper } from './price-format-helper';
import {
  Subject,
  Subscription
} from 'rxjs';
import { debounceTime } from 'rxjs/operators';

interface ChartSeries {
  candlestickSeries: ISeriesApi<"Candlestick">;
  volumeSeries: ISeriesApi<"Histogram">;
}

type CandleDisplay = Candle & { time: Time };

export class LightChartWrapper {
  private chart!: IChartApi | null;
  private chartSeries!: ChartSeries | null;
  private loadedHistoryPoints: Candle[] = [];
  private isHistoryEnded = false;
  private readonly subscriptions = new Subscription();

  private constructor(private readonly config: LightChartConfig) {
  }

  public static create(config: LightChartConfig): LightChartWrapper {
    const chart = new LightChartWrapper(config);
    chart.init();

    return chart;
  }

  clear(): void {
    this.config.dataFeed.unsubscribe();
    this.subscriptions.unsubscribe();
    this.chart?.remove();
    this.chartSeries = null;
    this.chart = null;
  }

  resize(width: number, height: number): void {
    this.chart?.resize(width, height);
  }

  private init(): void {
    this.chart = createChart(this.config.containerId, this.getChartOptions());
    this.chartSeries = this.initChartSeries(this.chart);
    this.loadInitialData();
  }

  private getChartOptions(): DeepPartial<ChartOptions> {
    return {
      localization: {
        locale: this.config.locale
      },
      timeScale: {
        timeVisible: true,
        borderColor: this.config.themeColors.chartGridColor,
      },
      rightPriceScale: {
        autoScale: true,
        visible: true,
        borderColor: this.config.themeColors.chartGridColor,
      },
      layout: {
        background: {type: ColorType.Solid, color: this.config.themeColors.componentBackground}, // '#ffffff',
        textColor: this.config.themeColors.chartLabelsColor,
      },
      grid: {
        horzLines: {
          color: this.config.themeColors.chartGridColor, // '#F0F3FA',
        },
        vertLines: {
          color: this.config.themeColors.chartGridColor, // '#F0F3FA',
        },
      },
      crosshair: {
        mode: CrosshairMode.Normal
      }
    };
  }

  private initChartSeries(target: IChartApi): ChartSeries {
    const priceScaleId = 'right';
    const volumeScaleId = 'volume';

    const candlestickSeries = target.addCandlestickSeries({
      upColor: this.config.themeColors.buyColor,
      downColor: this.config.themeColors.sellColor,
      wickUpColor: this.config.themeColors.buyColorBackground,
      wickDownColor: this.config.themeColors.sellColorBackground,
      borderVisible: false,
      priceScaleId,
      priceFormat: PriceFormatHelper.getPriceFormat(this.config.instrumentDetails.priceMinStep)
    });

    const volumeSeries = target.addHistogramSeries({
      color: '#26a69a',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: volumeScaleId,
    });

    target.priceScale(priceScaleId).applyOptions({
      autoScale: true,
      scaleMargins: {
        top: 0,
        bottom: 0.25,
      }
    });

    target.priceScale(volumeScaleId).applyOptions({
      autoScale: true,
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      }
    });

    this.chart?.timeScale().fitContent();
    return {
      candlestickSeries,
      volumeSeries
    };
  }

  private loadInitialData(): void {
    this.chartSeries?.candlestickSeries.setData([]);
    this.chartSeries?.volumeSeries.setData([]);

    const finishInitialLoading = (): void => {
      this.fillVisibleTimeScale(() => {
        this.initRealtimeDataSubscription();
        this.initTimeScaleMoveHandling();
      });
    };

    this.loadHistoryPeriod(
      this.getInitialHistoryFromTime() / 1000,
      this.getHistoryEndTime() / 1000,
      true,
      (meta) => {
        if (this.loadedHistoryPoints.length === 0 && meta.prevTime != null) {
          this.loadHistoryPeriod(
            meta.prevTime!,
            this.getHistoryEndTime() / 1000,
            true,
            () => finishInitialLoading()
          );
        }
        else {
          finishInitialLoading();
        }
      });
  }

  private initTimeScaleMoveHandling(): void {
    const sub = new Subject<LogicalRange>();

    this.chart?.timeScale().subscribeVisibleLogicalRangeChange(logicalRange => {
      if (!!logicalRange) {
        sub.next(logicalRange);
      }
    });

    this.subscriptions.add(sub.pipe(
      debounceTime(500)
    ).subscribe(range => {
      if (range.from <= 0 && !this.isHistoryEnded) {
        this.fillVisibleTimeScale();
      }
    }));
  }

  private initRealtimeDataSubscription(): void {
    this.config.dataFeed.subscribeBars(
      this.config.timeFrame,
      candle => {
        if (!this.chart) {
          return;
        }

        const displayCandle = this.toDisplayCandle(candle);
        this.chartSeries?.candlestickSeries.update(displayCandle as any);
        this.chartSeries?.volumeSeries.update(this.toVolumePoint(displayCandle));
      }
    );
  }

  private fillVisibleTimeScale(complete?: () => void, prevHistoryTime?: number): void {
    const visibleRange = this.chart?.timeScale().getVisibleLogicalRange();
    if (!visibleRange || visibleRange.from > 0 || this.loadedHistoryPoints.length === 0) {
      complete?.();
      return;
    }

    const historyStart = this.loadedHistoryPoints[0].time;
    const from = Math.min(prevHistoryTime ?? Number.MAX_VALUE, this.getTimeFrameHistoryPointMove(new Date(historyStart * 1000)) / 1000);

    this.loadHistoryPeriod(from, historyStart, false, (meta) => {
      if ((meta.noData ?? false) || meta.prevTime == null) {
        complete?.();
        return;
      }

      this.fillVisibleTimeScale(() => complete?.(), meta.prevTime);
    });
  }

  private loadHistoryPeriod(from: number, to: number, isFirst: boolean, complete: (meta: HistoryMetadata) => void): void {
    this.config.dataFeed.getHistory(
      {
        from,
        to,
        firstDataRequest: isFirst
      },
      (bars, meta) => {
        this.loadedHistoryPoints = TimeframesHelper.aggregateBars(this.loadedHistoryPoints, bars, this.config.timeFrame);
        this.updateHistoryData();

        this.isHistoryEnded = meta.prevTime == null;

        complete(meta);
      }
    );
  }

  private updateHistoryData(): void {
    if (!this.chart) {
      return;
    }

    const displayData = this.loadedHistoryPoints.map(x => this.toDisplayCandle(x));

    this.chartSeries?.candlestickSeries.setData(displayData as any);

    const volumes = displayData.map(candle => this.toVolumePoint(candle));

    this.chartSeries?.volumeSeries.setData(volumes as any);
  }

  private toVolumePoint(candle: Candle): HistogramData {
    return {
      time: candle.time as UTCTimestamp,
      value: candle.volume,
      color:
        candle.close >= candle.open
          ? this.config.themeColors.buyColor
          : this.config.themeColors.sellColor,
    };
  }

  private toDisplayCandle(candle: Candle): CandleDisplay {
    const candleDate = !!this.config.timeConvertor
      ? this.config.timeConvertor.toDisplayTime(candle.time)
      : candle.time * 1000;

    let displayTime: Time = candleDate as UTCTimestamp;
    if (this.config.timeFrame === TimeframeValue.Month || this.config.timeFrame === TimeframeValue.Day) {
      const date = new Date(candleDate * 1000);
      displayTime = {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate()
      } as BusinessDay;
    }

    return {
      ...candle,
      time: displayTime
    } as CandleDisplay;
  }

  private getInitialHistoryFromTime(): number {
    const now = new Date();

    switch (this.config.timeFrame) {
      case TimeframeValue.Month:
        return (new Date(Date.UTC(now.getUTCFullYear() - 30, now.getUTCMonth()))).getTime();
      case TimeframeValue.Day:
        return (new Date(Date.UTC(now.getUTCFullYear() - 1, now.getUTCMonth()))).getTime();
      case TimeframeValue.H4:
        return (new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 2))).getTime();
      case TimeframeValue.H:
        return (new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 14))).getTime();
      case TimeframeValue.M15:
        return (new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 4))).getTime();
      case TimeframeValue.M5:
      case TimeframeValue.M1:
        return (new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 3))).getTime();
      case TimeframeValue.S10:
        return (new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes() - 20))).getTime();
      case TimeframeValue.S5:
      case TimeframeValue.S1:
        return (new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes() - 5))).getTime();
      default:
        return (new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1))).getTime();
    }
  }

  private getTimeFrameHistoryPointMove(fromDate: Date): number {
    switch (this.config.timeFrame) {
      case TimeframeValue.Month:
        return (new Date(Date.UTC(fromDate.getUTCFullYear() - 1, 0))).getTime();
      case TimeframeValue.W:
        return (new Date(Date.UTC(fromDate.getUTCFullYear(), fromDate.getUTCMonth() - 9))).getTime();
      case TimeframeValue.Day:
        return (new Date(Date.UTC(fromDate.getUTCFullYear(), fromDate.getUTCMonth() - 6))).getTime();
      case TimeframeValue.H4:
        return (new Date(Date.UTC(fromDate.getUTCFullYear(), fromDate.getUTCMonth() - 1))).getTime();
      case TimeframeValue.H:
        return (new Date(Date.UTC(fromDate.getUTCFullYear(), fromDate.getUTCMonth(),  fromDate.getUTCDate() - 7))).getTime();
      case TimeframeValue.M15:
        return (new Date(Date.UTC(fromDate.getUTCFullYear(), fromDate.getUTCMonth(), fromDate.getUTCDate() - 4))).getTime();
      case TimeframeValue.M5:
      case TimeframeValue.M1:
        return (new Date(Date.UTC(fromDate.getUTCFullYear(), fromDate.getUTCMonth(), fromDate.getUTCDate() - 3))).getTime();
      case TimeframeValue.S10:
        return (new Date(Date.UTC(fromDate.getUTCFullYear(), fromDate.getUTCMonth(), fromDate.getUTCDate(), fromDate.getUTCHours(), fromDate.getUTCMinutes() - 20))).getTime();
      case TimeframeValue.S5:
      case TimeframeValue.S1:
        return (new Date(Date.UTC(fromDate.getUTCFullYear(), fromDate.getUTCMonth(), fromDate.getUTCDate(), fromDate.getUTCHours(), fromDate.getUTCMinutes() - 5))).getTime();

      default:
        return (new Date(Date.UTC(fromDate.getUTCFullYear(), fromDate.getUTCMonth() - 1))).getTime();
    }
  }

  private getHistoryEndTime(): number {
    const now = new Date();
    return (new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1))).getTime();
  }
}
