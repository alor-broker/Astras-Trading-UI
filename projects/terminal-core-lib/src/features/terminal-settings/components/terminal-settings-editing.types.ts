import {
  DesignSettings,
  TableRowHeight,
  TerminalLanguage,
  TimezoneDisplayOption
} from '../terminal-settings.types';

export enum TabNames {
  usefulLinks,
  main,
  hotKeys,

  notifications,
  mobileDashboardLayout
}

export interface GeneralSettings {
  designSettings?: DesignSettings;
  timezoneDisplayOption?: TimezoneDisplayOption;
  isLogoutOnUserIdle?: boolean;
  userIdleDurationMin?: number;
  language?: TerminalLanguage | null;
  badgesBind?: boolean;
  badgesColors?: string[];
  tableRowHeight?: TableRowHeight;
  showCurrentTime?: boolean;
}
