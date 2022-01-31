import { HistoryRequest } from "src/app/shared/models/history/history-request.model";
import { LightChartSettings } from "src/app/shared/models/settings/light-chart-settings.model";
import { findUniqueElements } from "src/app/shared/utils/collections";
import { addDaysUnix, addHoursUnix } from "src/app/shared/utils/datetime";
import { Candle } from "../../../shared/models/history/candle.model";

export interface Timeframe {
  label: string,
  value: string
}

export class TimeframesHelper {

  private readonly candlesBatchSize = 300;

  timeFrames : Timeframe[] = [
    { label: 'H', value: '3600' },
    { label: 'D', value: 'D' }
  ]

   // LightCharts library throws errors, when bars is duplicationg or too close to each other
   aggregateBars(existing: Candle[], history: Candle[], options: LightChartSettings) {
    const tf = options.timeFrame;
    const getDate = (p: any) => {
      const d = new Date(p * 1000);
      return d.getDate() + '.' + d.getMonth() + '.' + d.getFullYear();
    }
    switch (tf) {
      case 'D':
        return findUniqueElements(
          [...existing, ...history],
          (b1, b2) => b1.time - b2.time,
          (b1, b2) => getDate(b1.time) == getDate(b2.time))
      case '3600':
        return findUniqueElements(
          [...existing, ...history],
          (b1, b2) => b1.time - b2.time,
          (b1, b2) => b1.time - b2.time < 3600)
      default:
        return existing;
    }
  }

  getValueByTfLabel(tf: string) {
    const timeframe = this.timeFrames.find(t => t.label == tf);
    if (!timeframe) {
      throw new Error('Unknown timeframe');
    }
    return timeframe;
  }

  getDefaultFrom(label: string) {
    const tf = this.getValueByTfLabel(label);
    switch(tf.label) {
      case 'D':
        return addDaysUnix(new Date(), -this.candlesBatchSize);
      case 'H':
        return addHoursUnix(new Date(), -this.candlesBatchSize);
      default:
        return 0;
    }
  }

  getRequest(minTime: number, options: LightChartSettings) {
    if (options && minTime != Infinity) {
      let from = minTime;
      if (options.timeFrame == 'D') {
        from = addDaysUnix(new Date(minTime * 1000), -this.candlesBatchSize)
      }
      else if (options.timeFrame == '3600') {
        from = addHoursUnix(new Date(minTime * 1000), -this.candlesBatchSize)
      }
      var request : HistoryRequest = {
        from,
        to: minTime,
        tf: options.timeFrame,
        code: options.symbol,
        exchange: options.exchange,
        instrumentGroup: options.instrumentGroup
      };
      return request;
    }
    return null;
  }
}
