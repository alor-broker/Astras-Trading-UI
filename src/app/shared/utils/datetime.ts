/**
 * Converts date to unixtime in seconds
 *
 * @param {Date} date date
 * @return {number} unixtime in seconds
 */
export function toUnixTime(date: Date): number {
  return Math.floor(date.getTime() / 1000);
}

/**
 * Adding months to provided date
 *
 * @param {Date} date date
 * @param {number} months number of months, negative if you need to substract
 * @return {number} unix time with updated date
 */
export function addMonthsUnix(date: Date, months: number): number {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return toUnixTime(result);
}

/**
 * Adding years to provided date
 *
 * @param {Date} date date
 * @param {number} years number of years, negative if you need to substract
 * @return {Date} updated date
 */
export function addYears(date: Date, years: number): Date {
  const result = new Date(date);
  result.setFullYear(result.getFullYear() + years);
  return result;
}

/**
 * Adding months to provided date
 *
 * @param {Date} date date
 * @param {number} months number of months, negative if you need to substract
 * @return {Date} updated date
 */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

/**
 * Adding days to provided date
 *
 * @param {Date} date
 * @param {number} days number of days, negative if you need to substract
 * @return {Date} updated date
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Adding hours to provided date
 *
 * @param {Date} date date
 * @param {number} hours number of hours, negative if you need to substract
 * @return {Date} updated date
 */
export function addHours(date: Date, hours: number): Date {
  return new Date(date.setHours(date.getHours() + hours));
}

/**
 * Adding minutes to provided date
 *
 * @param {Date} date date
 * @param {number} minutes number of minutes, negative if you need to substract
 * @return {Date} updated date
 */
export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.setMinutes(date.getMinutes() + minutes));
}

/**
 * Adding seconds to provided date
 *
 * @param {Date} date date
 * @param {number} seconds number of seconds, negative if you need to substract
 * @return {Date} updated date
 */
export function addSeconds(date: Date, seconds: number): Date {
  return new Date(date.setSeconds(date.getSeconds() + seconds));
}

/**
 * Adding days to provided date
 *
 * @param {Date} date
 * @param {number} days number of days, negative if you need to substract
 * @return {number} unix time (seconds) with updated date
 */
export function addDaysUnix(date: Date, days: number): number {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return toUnixTime(result);
}

/**
 * Adding hours to provided date
 *
 * @param {Date} date date to update
 * @param {number} hours number of hours, negative if you need to substract
 * @return {number} unixtime with updated time
 */
export function addHoursUnix(date: Date, hours: number): number {
  const time = new Date(date.setHours(date.getHours() + hours));
  return toUnixTime(time);
}

/**
 * Converts Date to unixtime in seconds
 *
 * @param {Date} date date to convert
 * @return {number} unixtime in seconds
 */
export function toUnixTimestampSeconds(date: Date): number {
  return Number((Number(date) / 1000).toFixed(0));
}

/**
 * Converts Date to unixtimestamp in milliseconds
 *
 * @param {Date} date date to convert
 * @return {number} unixtime in millies
 */
export function toUnixTimestampMillies(date: Date): number {
  return Number(date);
}

/**
 * Remove the time part from date (set to 00:00)
 *
 * @param {Date} date date
 * @return {Date} date without time
 */
export function startOfDay(date: Date): Date {
  return new Date(date.setHours(0, 0, 0, 0));
}

/**
 * Sets date to first day of month
 *
 * @param {Date} date date
 * @return {Date} date with first day of month
 */
export function startOfMonth(date: Date): Date {
  return new Date(date.setDate(1));
}

/**
 * Sets date to last day of month
 *
 * @param {Date} date date
 * @return {Date} date with last day of month
 */
export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

/**
 * Converts unixtime to Date
 *
 * @param {number} date date in unixtime
 * @return {Date} Date as JS entity
 */
export function fromUnixTime(date: number): Date {
  return new Date(date * 1000);
}

/**
 * A function to get a current UTC time
 *
 * @return {Date} current UTC time
 */
export function getUtcNow(): Date {
  const now = new Date();
  return new Date(now.getTime() + now.getTimezoneOffset() * 60 * 1000);
}

/**
 * A function to get ISO string of date only
 * @return {string} date only string
 */
export function getISOStringDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * A function to get dates difference in days
 * @param {Date} a first date
 * @param {Date} b second date
 * @return {number} difference in days
 */
export function dateDiffInDays(a: Date, b: Date): number {
  const dayMilliseconds = 1000 * 60 * 60 * 24;

  const utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());

  return Math.floor((utc2 - utc1) / dayMilliseconds);
}
