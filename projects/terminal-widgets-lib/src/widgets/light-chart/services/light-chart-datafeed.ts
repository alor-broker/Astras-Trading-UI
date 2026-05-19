import {
  Subscription,
  take
} from 'rxjs';
import {InstrumentKey} from '@terminal-core-lib/common/types/instrument.types';
import {TimeframeValue} from '@terminal-core-lib/common/types/timeframe.types';
import {CandlesService} from '@terminal-core-lib/features/instruments/services/candles.service';
import {
  HistoryCallback,
  PeriodParams
} from '@terminal-widgets-lib/widgets/light-chart/types/light-chart.types';
import {Candle} from '@terminal-core-lib/features/instruments/services/candles-service.types';

export class LightChartDatafeed {
  private lastHistoryPoint: number | null = null;

  private lastBarSubscription: Subscription | null = null;

  private readonly historyPointsCountBack = 300;

  constructor(
    private readonly instrumentKey: InstrumentKey,
    private readonly timeFrame: TimeframeValue,
    private readonly candlesService: CandlesService,
  ) {
  }

  getHistory(
    periodParams: PeriodParams,
    onResult: HistoryCallback
  ): void {
    if (periodParams.firstDataRequest) {
      this.lastHistoryPoint = null;
    }

    this.candlesService.getHistory({
      symbol: this.instrumentKey.symbol,
      exchange: this.instrumentKey.exchange,
      from: periodParams.from,
      to: periodParams.to,
      tf: this.timeFrame,
      countBack: this.historyPointsCountBack
    }).pipe(
      take(1)
    ).subscribe(history => {
      if (!history) {
        return;
      }

      const dataIsEmpty = history.history.length === 0;

      if (periodParams.firstDataRequest) {
        this.lastHistoryPoint = dataIsEmpty
          ? this.getDefaultLastHistoryPoint(this.timeFrame)
          : history.history[history.history.length - 1].time;
      }

      onResult(
        history.history,
        {
          noData: dataIsEmpty,
          prevTime: history.prev
        }
      );
    });
  }

  subscribeBars(timeFrame: TimeframeValue, onResult: (candle: Candle) => void): void {
    this.lastBarSubscription?.unsubscribe();

    this.lastBarSubscription = this.candlesService.getCandleSubscription(
      this.instrumentKey,
      timeFrame,
      this.lastHistoryPoint ?? this.getDefaultLastHistoryPoint(timeFrame)
    ).subscribe(candle => {
      if (this.lastHistoryPoint == null || candle.time < this.lastHistoryPoint!) {
        return;
      }

      this.lastHistoryPoint = candle.time;

      onResult({
        ...candle,
        time: candle.time
      });
    });
  }

  unsubscribe(): void {
    this.lastBarSubscription?.unsubscribe();
  }

  private getDefaultLastHistoryPoint(timeFrame: TimeframeValue): number {
    const now = new Date();

    switch (timeFrame) {
      case TimeframeValue.Month:
      case TimeframeValue.W:
      case TimeframeValue.Day:
        return (new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))).getTime() / 1000;
      case TimeframeValue.H4:
        return (new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours() - 4))).getTime() / 1000;
      case TimeframeValue.H:
        return (new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours() - 1))).getTime() / 1000;
      case TimeframeValue.M15:
        return (new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes() - 15))).getTime() / 1000;
      case TimeframeValue.M5:
        return (new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes() - 5))).getTime() / 1000;
      case TimeframeValue.M1:
        return (new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes() - 1))).getTime() / 1000;
      case TimeframeValue.S10:
        return (new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds() - 10))).getTime() / 1000;
      case TimeframeValue.S5:
        return (new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds() - 5))).getTime() / 1000;
      case TimeframeValue.S1:
        return (new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds() - 1))).getTime() / 1000;
      default:
        return now.getTime() / 1000;
    }
  }
}
