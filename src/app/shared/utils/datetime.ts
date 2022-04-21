export function addDays(date: Date, days: number) {
  var result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function addHours(date: Date, hours: number) {
  return new Date(date.setHours(date.getHours() + hours));
}

export function addDaysUnix(date: Date, days: number) {
  var result = new Date(date);
  result.setDate(result.getDate() + days);
  return Math.floor(result.getTime() / 1000);
}

export function addHoursUnix(date: Date, hours: number) {
  const time = new Date(date.setHours(date.getHours() + hours)).getTime() / 1000;
  return Math.floor(time);
}

export function toUnixTimestampSeconds(date: Date) : number {
  return Number((Number(date) / 1000).toFixed(0));
}

export function toUnixTimestampMillies(date: Date) : number {
  return Number(date);
}
