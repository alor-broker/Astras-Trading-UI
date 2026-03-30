import {
  DesignSettings,
  TerminalLanguage
} from "../../../shared/models/terminal-settings/terminal-settings.model";
import {TimezoneDisplayOption} from "../../../shared/models/enums/timezone-display-option";
import { TableRowHeight } from "../../../shared/models/enums/table-row-height";

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
