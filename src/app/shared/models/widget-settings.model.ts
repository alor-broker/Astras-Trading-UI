export interface WidgetSettings {
  title?: string,
  guid: string,
  linkToActive?: boolean
  settingsType?: string;
  badgeColor?: string;
  titleIcon?: string;
  excludedFields?: string[]

  [key:string]:any;
}
