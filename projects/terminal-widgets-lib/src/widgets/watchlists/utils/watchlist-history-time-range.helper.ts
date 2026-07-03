import {
  getUnixTime,
  subDays
} from 'date-fns';
import {TimeframeValue} from '@terminal-core-lib/common/types/timeframe.types';

export class WatchlistHistoryTimeRangeHelper {
  static getFromTime(timeframe: TimeframeValue, now = new Date()): number {
    switch (timeframe) {
      case TimeframeValue.Day:
        return getUnixTime(subDays(now, 21));
      case TimeframeValue.W:
        return getUnixTime(subDays(now, 90));
      case TimeframeValue.Month:
        return getUnixTime(subDays(now, 366));
      default:
        return getUnixTime(subDays(now, 7));
    }
  }

  static getToTime(now = new Date()): number {
    return getUnixTime(now);
  }
}
