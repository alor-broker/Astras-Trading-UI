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
