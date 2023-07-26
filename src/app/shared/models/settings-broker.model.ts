export interface SettingsMeta {
  timestamp: number;
}

export interface SettingsRecord<T> {
  meta: SettingsMeta;
  value: T;
}
