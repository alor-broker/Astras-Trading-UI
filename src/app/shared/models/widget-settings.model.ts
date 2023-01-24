export interface WidgetSettings {
  title?: string,
  guid: string,
  linkToActive?: boolean
  settingsType?: string;
  badgeColor?: string;
  titleIcon?: string;
}

export type SettingsDraft<T extends WidgetSettings> = Omit<T, 'guid'>;
