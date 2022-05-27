export function addMonthsUnix(date: Date, months: number) {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

export function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function addHours(date: Date, hours: number) {
  return new Date(date.setHours(date.getHours() + hours));
}

export function addDaysUnix(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return toUnixTime(result);
}

export function addHoursUnix(date: Date, hours: number) {
  const time = new Date(date.setHours(date.getHours() + hours));
  return toUnixTime(time);
}

export function toUnixTimestampSeconds(date: Date) : number {
  return Number((Number(date) / 1000).toFixed(0));
}

export function toUnixTimestampMillies(date: Date) : number {
  return Number(date);
}

export function toUnixTime(date: Date) : number {
  return Math.floor(date.getTime() / 1000);
}

export function fromUnixTime(date: number) : Date {
  return new Date(date * 1000);
}

