import { findUniqueElements } from "src/app/shared/utils/collections";
import { Candle } from "../../../shared/models/history/candle.model";
import { TimeframeValue } from "../models/light-chart.models";

export interface Timeframe {
  label: string,
  value: TimeframeValue
}

export class TimeframesHelper {
  public static timeFrames: Timeframe[] = [
    { label: '1s', value: TimeframeValue.S1 },
    { label: '5s', value: TimeframeValue.S5 },
    { label: '10s', value: TimeframeValue.S10 },
    { label: '1m', value: TimeframeValue.M1 },
    { label: '5m', value: TimeframeValue.M5 },
    { label: '15m', value: TimeframeValue.M15 },
    { label: 'H', value: TimeframeValue.H },
    { label: '4H', value: TimeframeValue.H4 },
    { label: 'D', value: TimeframeValue.Day },
    { label: 'M', value: TimeframeValue.Month },
  ];

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
      case TimeframeValue.S10:
        return findUniqueElements(
          [...existing, ...history],
          (b1, b2) => b1.time - b2.time,
          (b1, b2) => b1.time - b2.time < 10);
      case TimeframeValue.S5:
        return findUniqueElements(
          [...existing, ...history],
          (b1, b2) => b1.time - b2.time,
          (b1, b2) => b1.time - b2.time < 5);
      case TimeframeValue.S1:
        return findUniqueElements(
          [...existing, ...history],
          (b1, b2) => b1.time - b2.time,
          (b1, b2) => b1.time - b2.time < 1);
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
}
