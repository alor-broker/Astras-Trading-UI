import { TimezoneConverter } from './timezone-converter';
import { TimezoneDisplayOption } from '../models/enums/timezone-display-option';
import { fromUnixTime } from './datetime';

describe('TimezoneConverter', () => {
  const testUnixTimestamp = 1678886400;
  const testDate = fromUnixTime(testUnixTimestamp);

  describe('constructor', () => {
    it('should create an instance with a given displayTimezone', () => {
      const converter = new TimezoneConverter(TimezoneDisplayOption.MskTime);
      expect(converter).toBeTruthy();
      expect(converter.displayTimezone).toBe(TimezoneDisplayOption.MskTime);

      const converterLocal = new TimezoneConverter(TimezoneDisplayOption.LocalTime);
      expect(converterLocal).toBeTruthy();
      expect(converterLocal.displayTimezone).toBe(TimezoneDisplayOption.LocalTime);
    });
  });

  describe('toTerminalUtcDate', () => {
    it('should return UTC corrected date when displayTimezone is LocalTime', () => {
      const converter = new TimezoneConverter(TimezoneDisplayOption.LocalTime);
      const result = converter.toTerminalUtcDate(testUnixTimestamp);
      const expectedDate = new Date(testDate);
      expectedDate.setMinutes(expectedDate.getMinutes() - expectedDate.getTimezoneOffset());

      expect(result.getTime()).toBe(expectedDate.getTime());
    });

    it('should return Moscow time converted to UTC corrected date when displayTimezone is MskTime', () => {
      const originalToLocaleString = Date.prototype.toLocaleString;
      Date.prototype.toLocaleString = function (this: Date, locale?: string | string[], options?: Intl.DateTimeFormatOptions): string {
        if (options && options.timeZone === TimezoneConverter.moscowTimezone) {
          const mskDate = new Date(this.getTime() + 3 * 60 * 60 * 1000);
          return mskDate.toISOString();
        }

        return originalToLocaleString.call(this, locale, options);
      };

      const converter = new TimezoneConverter(TimezoneDisplayOption.MskTime);
      const result = converter.toTerminalUtcDate(testUnixTimestamp);

      const mskDateRepresentation = new Date(testDate.toLocaleString('en-US', {timeZone: TimezoneConverter.moscowTimezone}));
      const expectedDate = new Date(mskDateRepresentation);
      expectedDate.setMinutes(expectedDate.getMinutes() - expectedDate.getTimezoneOffset());

      expect(result.getTime()).toBe(expectedDate.getTime());

      Date.prototype.toLocaleString = originalToLocaleString;
    });
  });

  describe('toTerminalDate', () => {
    it('should return the same date if displayTimezone is LocalTime', () => {
      const converter = new TimezoneConverter(TimezoneDisplayOption.LocalTime);
      const result = converter.toTerminalDate(testDate);
      expect(result).toEqual(testDate);
    });

    it('should return Moscow time if displayTimezone is MskTime', () => {
      const originalToLocaleString = Date.prototype.toLocaleString;
      Date.prototype.toLocaleString = function (this: Date, locale?: string | string[], options?: Intl.DateTimeFormatOptions): string {
        if (options && options.timeZone === TimezoneConverter.moscowTimezone) {
          const mskDate = new Date(this.getTime() + 3 * 60 * 60 * 1000);
          return mskDate.toISOString();
        }

        return originalToLocaleString.call(this, locale, options);
      };

      const converter = new TimezoneConverter(TimezoneDisplayOption.MskTime);
      const result = converter.toTerminalDate(testDate);
      const expectedMskDate = new Date(testDate.toLocaleString('en-US', {timeZone: TimezoneConverter.moscowTimezone}));
      expect(result.getTime()).toBe(expectedMskDate.getTime());

      Date.prototype.toLocaleString = originalToLocaleString;
    });
  });

  describe('terminalToUtc0Date', () => {
    const dateInSomeTimezone = new Date('2023-03-15T10:00:00.000Z');

    it('should return the same date (normalized to UTC0) if displayTimezone is LocalTime and skipTime is false', () => {
      const converter = new TimezoneConverter(TimezoneDisplayOption.LocalTime);
      const result = converter.terminalToUtc0Date(dateInSomeTimezone, false);
      expect(result.getTime()).toBe(new Date(dateInSomeTimezone).getTime());
    });

    it('should return the date with time reset to 00:00:00 if displayTimezone is LocalTime and skipTime is true', () => {
      const converter = new TimezoneConverter(TimezoneDisplayOption.LocalTime);
      const result = converter.terminalToUtc0Date(dateInSomeTimezone, true);
      const expectedDate = new Date(dateInSomeTimezone);
      expectedDate.setHours(0, 0, 0, 0);
      expect(result.getTime()).toBe(expectedDate.getTime());
    });

    it('should convert from Msk terminal time to UTC0 when displayTimezone is MskTime and skipTime is false', () => {
      const originalToLocaleString = Date.prototype.toLocaleString;
      const originalGetTimezoneOffset = Date.prototype.getTimezoneOffset;

      Date.prototype.toLocaleString = function (this: Date, locale?: string | string[], options?: Intl.DateTimeFormatOptions): string {
        if (options && options.timeZone === TimezoneConverter.moscowTimezone) {
          const mskDate = new Date(this.getTime() + 3 * 60 * 60 * 1000);
          return mskDate.toISOString();
        }

        return originalToLocaleString.call(this, locale, options);
      };
      Date.prototype.getTimezoneOffset = (): number => 0;

      const converter = new TimezoneConverter(TimezoneDisplayOption.MskTime);
      const result = converter.terminalToUtc0Date(dateInSomeTimezone, false);

      const expectedUtcDate = new Date(dateInSomeTimezone.getTime() - 3 * 60 * 60 * 1000);
      expect(result.getUTCHours()).toBe(expectedUtcDate.getUTCHours());
      expect(result.getUTCMinutes()).toBe(expectedUtcDate.getUTCMinutes());

      Date.prototype.toLocaleString = originalToLocaleString;
      Date.prototype.getTimezoneOffset = originalGetTimezoneOffset;
    });
  });

  describe('getTimezone', () => {
    it('should return local timezone info if displayTimezone is LocalTime', () => {
      const converter = new TimezoneConverter(TimezoneDisplayOption.LocalTime);
      const result = converter.getTimezone();

      const expectedOffset = new Date().getTimezoneOffset();
      const expectedName = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const hoursOffset = Math.trunc(expectedOffset / 60);
      const minutesOffset = Math.abs(Math.round(((expectedOffset / 60) - hoursOffset) * 60));
      let expectedFormattedOffset = `${Math.abs(hoursOffset)}`;
      if (minutesOffset > 0) {
        expectedFormattedOffset += `:${minutesOffset}`;
      }

      expect(result.name).toBe(expectedName);
      expect(result.utcOffset).toBe(expectedOffset);
      expect(result.formattedOffset).toBe(expectedFormattedOffset);
    });

    it('should return Moscow timezone info if displayTimezone is MskTime', () => {
      const originalToLocaleString = Date.prototype.toLocaleString;
      const originalGetTimezoneOffset = Date.prototype.getTimezoneOffset;

      Date.prototype.getTimezoneOffset = (): number => 0;
      Date.prototype.toLocaleString = function (this: Date, locale?: string | string[], options?: Intl.DateTimeFormatOptions): string {
        if (options && options.timeZone === TimezoneConverter.moscowTimezone) {
          const mskDate = new Date(this.getTime() + 3 * 60 * 60 * 1000);
          return mskDate.toISOString();
        }

        return originalToLocaleString.call(this, locale, options);
      };

      const converter = new TimezoneConverter(TimezoneDisplayOption.MskTime);
      const result = converter.getTimezone();

      expect(result.name).toBe(TimezoneConverter.moscowTimezone);
      expect(result.utcOffset).toBe(-180);
      expect(result.formattedOffset).toBe('3');

      Date.prototype.toLocaleString = originalToLocaleString;
      Date.prototype.getTimezoneOffset = originalGetTimezoneOffset;
    });
  });
});
