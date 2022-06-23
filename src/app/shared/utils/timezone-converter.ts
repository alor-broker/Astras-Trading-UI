import { TimezoneDisplayOption } from '../models/enums/timezone-display-option';
import { fromUnixTime } from './datetime';

/**
 * Responsible for converting time with different timezones
 */
export class TimezoneConverter {
  constructor(private readonly displayTimezone: TimezoneDisplayOption) {
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
      const mskTime = this.toMskTime(localTime);
      const correction = localTime.getTime() - mskTime.getTime();

      convertedDate = new Date(convertedDate.getTime() + correction);
    }

    return new Date(convertedDate.getTime());
  }

  private toUtcCorrectedDate(date: Date) {
    const convertedDate = new Date(date);
    convertedDate.setMinutes(convertedDate.getMinutes() - convertedDate.getTimezoneOffset());
    return convertedDate;
  }

  private toMskTime(utcDate: Date): Date {
    return new Date(utcDate.toLocaleString('en-US', { timeZone: 'Europe/Moscow' }));
  }
}
