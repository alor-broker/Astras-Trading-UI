import { TimezoneConverter } from './timezone-converter';
import { TimezoneDisplayOption } from '../models/enums/timezone-display-option';

describe('TimezoneConverter', () => {
  const mskTimeUtcOffsetMilliseconds = -3 * 60 * 60 * 1000;
  it('#toTerminalUtcDate with LocalTime', () => {
    const converter = new TimezoneConverter(TimezoneDisplayOption.LocalTime);

    const utcDateMilliseconds = Date.UTC(2022, 5, 1, 10, 24, 37);
    const convertedDate = converter.toTerminalUtcDate(utcDateMilliseconds / 1000);

    const expectedLocalTime = new Date(utcDateMilliseconds - (new Date().getTimezoneOffset() * 60000));

    expect(convertedDate.toUTCString()).toEqual(expectedLocalTime.toUTCString());
  });

  it('#toTerminalUtcDate with MskTime', () => {
    const converter = new TimezoneConverter(TimezoneDisplayOption.MskTime);

    const utcDateMilliseconds = Date.UTC(2022, 5, 1, 10, 24, 37);
    const convertedDate = converter.toTerminalUtcDate(utcDateMilliseconds / 1000);

    const expectedMskTime = new Date(utcDateMilliseconds - mskTimeUtcOffsetMilliseconds);

    expect(convertedDate.toUTCString()).toEqual(expectedMskTime.toUTCString());
  });

  it('#toTerminalDate with LocalTime', () => {
    const converter = new TimezoneConverter(TimezoneDisplayOption.LocalTime);

    const utcDate = new Date(Date.UTC(2022, 5, 1, 10, 24, 37));
    const convertedDate = converter.toTerminalDate(utcDate);

    const expectedLocalTime = new Date(utcDate.getTime());

    expect(convertedDate.toLocaleString()).toEqual(expectedLocalTime.toLocaleString());
  });

  it('#toTerminalDate with MskTime', () => {
    const converter = new TimezoneConverter(TimezoneDisplayOption.MskTime);

    const utcDate = new Date(Date.UTC(2022, 5, 1, 10, 24, 37));
    const convertedDate = converter.toTerminalDate(utcDate);

    const timeCorrection = mskTimeUtcOffsetMilliseconds - new Date().getTimezoneOffset() * 60000;
    const expectedMskTime = new Date(utcDate.getTime() - timeCorrection);

    expect(convertedDate.toLocaleString()).toEqual(expectedMskTime.toLocaleString());
  });

  it('#terminalToUtc0Date with LocalTime', () => {
    const converter = new TimezoneConverter(TimezoneDisplayOption.LocalTime);

    const terminalDate = new Date(2022, 5, 1, 15, 45, 21);
    const convertedDate = converter.terminalToUtc0Date(terminalDate);

    const expectedUtcTime = new Date(terminalDate.getTime());

    expect(convertedDate.toUTCString()).toEqual(expectedUtcTime.toUTCString());
  });

  it('#terminalToUtc0Date with MskTime', () => {
    const converter = new TimezoneConverter(TimezoneDisplayOption.MskTime);

    const terminalDate = new Date(2022, 5, 1, 13, 45, 21);
    const convertedDate = converter.terminalToUtc0Date(terminalDate);

    const timeCorrection = mskTimeUtcOffsetMilliseconds - new Date().getTimezoneOffset() * 60000;
    const expectedUtcTime = new Date(terminalDate.getTime() + timeCorrection);

    expect(convertedDate.toUTCString()).toEqual(expectedUtcTime.toUTCString());
  });
});
