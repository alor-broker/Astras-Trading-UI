export enum SettingsType {
  DashboardSettings= 'dashboardSettings'
}

export interface SettingsMeta {
  settingsType: SettingsType;
  timestamp: number;
}

export interface SettingsRef {
  id: string;
  meta: SettingsMeta;
}
