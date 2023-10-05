export enum ThemeType {
  dark = 'dark',
  default = 'default',
}

export interface ThemeColors {
  sellColor: string;
  sellColorBackground: string;
  sellColorAccent: string;
  buyColor: string;
  buyColorBackground: string;
  buyColorBackgroundLight: string;
  buySellLabelColor: string;
  buyColorAccent: string;
  componentBackground: string;
  primaryColor: string;
  purpleColor: string;
  errorColor: string;
  chartGridColor: string;
  chartLabelsColor: string;
  chartPrimaryTextColor: string;
  chartBackground: string;
  textColor: string;
}

export interface ThemeSettings {
  theme: ThemeType;
  themeColors: ThemeColors;
}
