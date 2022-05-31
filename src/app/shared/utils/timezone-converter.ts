import { TimezoneDisplayOption } from '../models/enums/timezone-display-option';
import { fromUnixTime } from './datetime';

export class TimezoneConverter {
  constructor(private readonly displayTimezone: TimezoneDisplayOption) {
  }

  // returns date that will not be converted into local date
  // this date is used by third party components
  // such components do not convert date to local date and use only UTC date methods
  public toTerminalUtcDate(utcDate: number): Date {
    const convertedDate = this.toTerminalDate(fromUnixTime(utcDate));
    return this.toUtcCorrectedDate(convertedDate);
  }

  // returns date that can be converted into local date with toLocaleString() method
  public toTerminalDate(utcDate: Date): Date {
    if (this.displayTimezone === TimezoneDisplayOption.MskTime) {
      return this.toMskTime(utcDate);
    }

    return utcDate;
  }

  public terminalToUtc0Date(date: Date): Date {
    let convertedDate = date;
    if (this.displayTimezone === TimezoneDisplayOption.MskTime) {
      const localTime = new Date();
      const mskTime = this.toMskTime(localTime);
      const correction = localTime.getTime() - mskTime.getTime();

      convertedDate = new Date(convertedDate.getTime() + correction);
    }

    return new Date(convertedDate.getTime() + convertedDate.getTimezoneOffset());
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
