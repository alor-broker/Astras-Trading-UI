export enum ThemeType {
  dark = 'dark',
  default = 'default',
}

export interface ThemeColors {
  sellColor: string;
  sellColorBackground: string;
  buyColor: string;
  buyColorBackground: string;
  componentBackground: string;
  primaryColor: string;
  purpleColor5: string;
  errorColor: string;
  chartGridColor: string;
}

export interface ThemeSettings {
  theme: ThemeType;
  themeColors: ThemeColors;
}
