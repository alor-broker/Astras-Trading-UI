import { TimezoneDisplayOption } from '../enums/timezone-display-option';

export interface TerminalSettings {
  timezoneDisplayOption?: TimezoneDisplayOption
  userIdleDurationMin?: number;
}
