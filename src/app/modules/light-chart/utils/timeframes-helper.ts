import { HistoryRequest } from "src/app/shared/models/history/history-request.model";
import { LightChartSettings } from "src/app/shared/models/settings/light-chart-settings.model";
import { findUniqueElements } from "src/app/shared/utils/collections";
import { addDaysUnix, addHoursUnix } from "src/app/shared/utils/datetime";
import { Candle } from "../../../shared/models/history/candle.model";

export enum TimeframeValue {
  M1 = '60',
  M5 = '300',
  M15 = '900',
  H = '3600',
  H4 = '14400',
  Day = 'D',
  Month = 'M'
}

export interface Timeframe {
  label: string,
  value: TimeframeValue
}

export class TimeframesHelper {
  public static timeFrames: Timeframe[] = [
    { label: '1m', value: TimeframeValue.M1 },
    { label: '5m', value: TimeframeValue.M5 },
    { label: '15m', value: TimeframeValue.M15 },
    { label: 'H', value: TimeframeValue.H },
    { label: '4H', value: TimeframeValue.H4 },
    { label: 'D', value: TimeframeValue.Day },
    { label: 'M', value: TimeframeValue.Month },
  ];

  private static timeframeBatchSizes = new Map<TimeframeValue, number>([
    // 3 years
    [TimeframeValue.Month, 36],
    // 6 months
    [TimeframeValue.Day, 180],
    // 3 months
    [TimeframeValue.H4, 540],
    // 1 month
    [TimeframeValue.H, 720],
    // 1 week
    [TimeframeValue.M15, 672],
    // 3 days
    [TimeframeValue.M5, 864],
    // 8 hours
    [TimeframeValue.M1, 480],
  ]);

  // LightCharts library throws errors, when bars is duplicationg or too close to each other
  static aggregateBars(existing: Candle[], history: Candle[], selectedTimeframe: TimeframeValue) {
    const getDate = (p: any) => {
      const d = new Date(p * 1000);
      return d.getDate() + '.' + d.getMonth() + '.' + d.getFullYear();
    };
    switch (selectedTimeframe) {
      case TimeframeValue.Month:
        return findUniqueElements(
          [...existing, ...history],
          (b1, b2) => b1.time - b2.time,
          (b1, b2) => getDate(b1.time) == getDate(b2.time));
      case TimeframeValue.Day:
        return findUniqueElements(
          [...existing, ...history],
          (b1, b2) => b1.time - b2.time,
          (b1, b2) => getDate(b1.time) == getDate(b2.time));
      case TimeframeValue.H4:
        return findUniqueElements(
          [...existing, ...history],
          (b1, b2) => b1.time - b2.time,
          (b1, b2) => b1.time - b2.time < 14400);
      case TimeframeValue.H:
        return findUniqueElements(
          [...existing, ...history],
          (b1, b2) => b1.time - b2.time,
          (b1, b2) => b1.time - b2.time < 3600);
      case TimeframeValue.M15:
        return findUniqueElements(
          [...existing, ...history],
          (b1, b2) => b1.time - b2.time,
          (b1, b2) => b1.time - b2.time < 900);
      case TimeframeValue.M5:
        return findUniqueElements(
          [...existing, ...history],
          (b1, b2) => b1.time - b2.time,
          (b1, b2) => b1.time - b2.time < 300);
      case TimeframeValue.M1:
        return findUniqueElements(
          [...existing, ...history],
          (b1, b2) => b1.time - b2.time,
          (b1, b2) => b1.time - b2.time < 60);
      default:
        return existing;
    }
  }

  static getTimeframeByValue(timeframeValue: string): Timeframe {
    const timeframe = TimeframesHelper.timeFrames.find(t => t.value === timeframeValue);
    if (!timeframe) {
      throw new Error('Unknown timeframe');
    }

    return timeframe;
  }

  static getFromTimeForTimeframe(timeframeValue: string, from?: Date) {
    const tf = this.getTimeframeByValue(timeframeValue);

    const batchSize = this.timeframeBatchSizes.get(tf?.value) ?? 5;
    const startPoint = from ?? new Date();

    switch (tf?.value) {
      case TimeframeValue.Month:
        return addDaysUnix(startPoint, -batchSize * 30);
      case TimeframeValue.Day:
        return addDaysUnix(startPoint, -batchSize);
      case TimeframeValue.H4:
        return addHoursUnix(startPoint, -batchSize * 4);
      case TimeframeValue.H:
        return addHoursUnix(startPoint, -batchSize);
      case TimeframeValue.M15:
        return addHoursUnix(startPoint, -batchSize / 4);
      case TimeframeValue.M5:
        return addHoursUnix(startPoint, -batchSize / 12);
      case TimeframeValue.M1:
        return addHoursUnix(startPoint, -batchSize / 60);
      default:
        return startPoint.getTime() / 1000;
    }
  }

  static getRequest(loadedMinTime: number, options: LightChartSettings, itemsCountToLoad: number, historyPrevTime: number | null = null) {
    let from = loadedMinTime;

    const batchSize = this.timeframeBatchSizes.get(options.timeFrame as TimeframeValue) ?? 5;

    if (options.timeFrame == TimeframeValue.Month) {
      from = addDaysUnix(new Date(loadedMinTime * 1000), -(Math.max(itemsCountToLoad, batchSize)) * 30);
    }
    else if (options.timeFrame == TimeframeValue.Day) {
      from = addDaysUnix(new Date(loadedMinTime * 1000), -(Math.max(itemsCountToLoad, batchSize)));
    }
    else if (options.timeFrame == TimeframeValue.H4) {
      from = addHoursUnix(new Date(loadedMinTime * 1000), -(Math.max(itemsCountToLoad, batchSize)) * 4);
    }
    else if (options.timeFrame == TimeframeValue.H) {
      from = addHoursUnix(new Date(loadedMinTime * 1000), -(Math.max(itemsCountToLoad, batchSize)));
    }
    else if (options.timeFrame == TimeframeValue.M15) {
      from = addHoursUnix(new Date(loadedMinTime * 1000), -(Math.max(itemsCountToLoad, batchSize)) / 4);
    }
    else if (options.timeFrame == TimeframeValue.M5) {
      from = addHoursUnix(new Date(loadedMinTime * 1000), -(Math.max(itemsCountToLoad, batchSize)) / 12);
    }
    else if (options.timeFrame == TimeframeValue.M1) {
      from = addHoursUnix(new Date(loadedMinTime * 1000), -(Math.max(itemsCountToLoad, batchSize)) / 60);
    }

    if (historyPrevTime != null && historyPrevTime < from) {
      from = historyPrevTime;
    }

    return {
      from,
      to: loadedMinTime,
      tf: options.timeFrame,
      code: options.symbol,
      exchange: options.exchange,
      instrumentGroup: options.instrumentGroup
    } as HistoryRequest;
  }
}
