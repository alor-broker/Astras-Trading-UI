import {TimezoneDisplayOption} from '../models/enums/timezone-display-option';
import {fromUnixTime} from './datetime';

/**
 * Responsible for converting time with different timezones
 */
export class TimezoneConverter {
  static moscowTimezone = 'Europe/Moscow';

  constructor(public readonly displayTimezone: TimezoneDisplayOption) {
  }

  /**
   * Returns date that will not be converted into local date.
   * This date is used by third party components.
   * Such components do not convert date to local date and use only UTC date methods
   * @param utcSeconds - utc date in Unix format.
   */
  public toTerminalUtcDate(utcSeconds: number): Date {
    const convertedDate = this.toTerminalDate(fromUnixTime(utcSeconds));
    return this.toUtcCorrectedDate(convertedDate);
  }

  /**
   * Returns date that can be converted into local date with toLocaleString() method.
   * @param utcDate - utc date.
   */
  public toTerminalDate(utcDate: Date): Date {
    if (this.displayTimezone === TimezoneDisplayOption.MskTime) {
      return this.toMskTime(utcDate);
    }

    return utcDate;
  }

  /**
   * Converts terminal date (the date that is displayed in the terminal, taking into account the selected time zone) to utc date
   * @param {Date} dateWithTimezone -  terminal date.
   *
   * @returns {Date} utc date
   */
  public terminalToUtc0Date(dateWithTimezone: Date): Date {
    let convertedDate = dateWithTimezone;
    if (this.displayTimezone === TimezoneDisplayOption.MskTime) {
      const localTime = new Date();
      localTime.setMilliseconds(dateWithTimezone.getMilliseconds());
      localTime.setSeconds(dateWithTimezone.getSeconds());

      const mskTime = this.toMskTime(localTime);
      const correction = localTime.getTime() - mskTime.getTime();

      convertedDate = new Date(convertedDate.getTime() + correction);
    }

    return new Date(convertedDate.getTime());
  }

  /**
   * Returns timezone options in accordance with the current displayTimezone.
   * @returns timezone options
   */
  public getTimezone(): { name: string, utcOffset: number, formattedOffset: string } {
    let offset = new Date().getTimezoneOffset();
    let timezoneName = Intl.DateTimeFormat().resolvedOptions().timeZone;

    if (this.displayTimezone === TimezoneDisplayOption.MskTime) {
      timezoneName = TimezoneConverter.moscowTimezone;
      const localTime = new Date();
      localTime.setMilliseconds(0);
      localTime.setSeconds(0);
      const mskTime = this.toMskTime(localTime);
      const correction = ((localTime.getTime() - mskTime.getTime()) / 1000 / 60);
      offset = localTime.getTimezoneOffset() + correction;
    }

    const hoursOffset = Math.trunc(offset / 60);
    const minutesOffset = Math.abs(Math.round(((offset / 60) - hoursOffset) * 60));
    let formattedOffset = `${Math.abs(hoursOffset)}`;
    if (minutesOffset > 0) {
      formattedOffset += `:${minutesOffset}`;
    }

    return {
      name: timezoneName,
      utcOffset: offset,
      formattedOffset: formattedOffset
    };
  }


  private toUtcCorrectedDate(date: Date): Date {
    const convertedDate = new Date(date);
    convertedDate.setMinutes(convertedDate.getMinutes() - convertedDate.getTimezoneOffset());
    return convertedDate;
  }

  private toMskTime(utcDate: Date): Date {
    return new Date(utcDate.toLocaleString('en-US', {timeZone: TimezoneConverter.moscowTimezone}));
  }
}
