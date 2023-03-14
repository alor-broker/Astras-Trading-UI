import { DesignSettings } from '../../../shared/models/terminal-settings/terminal-settings.model';
import { TimezoneDisplayOption } from '../../../shared/models/enums/timezone-display-option';

export enum TabNames {
  usefulLinks,
  main,
  hotKeys,

  notifications
}

export interface GeneralSettings {
  designSettings?: DesignSettings;
  timezoneDisplayOption?: TimezoneDisplayOption;
  userIdleDurationMin?: number;
  language?: 'en' | 'ru' | null;
  badgesBind?: boolean;
}
