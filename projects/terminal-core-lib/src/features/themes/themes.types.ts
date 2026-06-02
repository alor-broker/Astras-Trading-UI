export enum ThemeType {
  dark = 'dark',
  default = 'default',
}

export interface ThemeColors {
  sellColor: string;
  sellColorBackground: string;
  sellColorAccent: string;
  buyColor: string;
  mixColor: string;
  buyColorBackground: string;
  buyColorBackgroundLight: string;
  buySellBtnTextColor: string;
  buyColorAccent: string;
  componentBackground: string;
  primaryColor: string;
  purpleColor: string;
  errorColor: string;
  chartGridColor: string;
  chartLabelsColor: string;
  chartPrimaryTextColor: string;
  chartShadow: string;
  tableGridColor: string;
  textColor: string;
  textMaxContrastColor: string;
}

export interface ThemeSettings {
  theme: ThemeType;
  themeColors: ThemeColors;
}
