import { TimezoneDisplayOption } from '../models/enums/timezone-display-option';

export class TimezoneConverter {
  constructor(private readonly displayTimezone: TimezoneDisplayOption) {
  }

  public utcToDisplayDate(utcDate: Date) {
    let convertedDate: Date;

    switch (this.displayTimezone) {
      case TimezoneDisplayOption.MskTime:
        convertedDate =  new Date(utcDate.toLocaleString('en-US', { timeZone: 'Europe/Moscow' }));
        break;
      default:
        convertedDate = new Date(utcDate);
        break;
    }

    convertedDate.setMinutes(convertedDate.getMinutes() - convertedDate.getTimezoneOffset());
    return convertedDate;
  }
}
