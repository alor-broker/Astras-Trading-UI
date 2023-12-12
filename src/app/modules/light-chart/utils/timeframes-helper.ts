import { findUniqueElements } from "src/app/shared/utils/collections";
import { Candle } from "../../../shared/models/history/candle.model";
import { TimeframeValue } from "../models/light-chart.models";

export class TimeframesHelper {
  // LightCharts library throws errors, when bars is duplicating or too close to each other
  static aggregateBars(existing: Candle[], history: Candle[], selectedTimeframe: TimeframeValue): Candle[] {
    const getDate = (p: any): string => {
      const d = new Date(p * 1000);
      return d.getDate().toString() + '.' + d.getMonth().toString() + '.' + d.getFullYear().toString();
    };
    switch (selectedTimeframe) {
      case TimeframeValue.Month:
      case TimeframeValue.W:
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
}
