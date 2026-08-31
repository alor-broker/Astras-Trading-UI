import {
  getUnixTime,
  subDays
} from 'date-fns';
import {TimeframeValue} from '@terminal-core-lib/common/types/timeframe.types';
import {WatchlistHistoryTimeRangeHelper} from './watchlist-history-time-range.helper';

describe('WatchlistHistoryTimeRangeHelper', () => {
  const now = new Date('2026-06-18T20:30:00.000Z');
  const nowUnixSeconds = getUnixTime(now);

  it('should use the current time as history end', () => {
    expect(WatchlistHistoryTimeRangeHelper.getToTime(now)).toBe(nowUnixSeconds);
  });

  it('should keep enough history range for countBack to return the latest points', () => {
    expect(WatchlistHistoryTimeRangeHelper.getFromTime(TimeframeValue.Day, now)).toBe(
      getUnixTime(subDays(now, 21))
    );
    expect(WatchlistHistoryTimeRangeHelper.getFromTime(TimeframeValue.W, now)).toBe(
      getUnixTime(subDays(now, 90))
    );
    expect(WatchlistHistoryTimeRangeHelper.getFromTime(TimeframeValue.Month, now)).toBe(
      getUnixTime(subDays(now, 366))
    );
    expect(WatchlistHistoryTimeRangeHelper.getFromTime(TimeframeValue.M5, now)).toBe(
      getUnixTime(subDays(now, 7))
    );
  });
});
