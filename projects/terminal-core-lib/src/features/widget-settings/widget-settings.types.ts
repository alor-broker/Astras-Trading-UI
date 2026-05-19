export interface WidgetSettings {
  guid: string;
  linkToActive?: boolean;
  settingsType?: string;
  badgeColor?: string;
  titleIcon?: string;
  excludedFields?: string[];
}

/**
 * A type with describes settings with depends on an instrument
 */
export interface InstrumentDependentSettings extends WidgetSettings {
  symbol: string;
  exchange: string;
  instrumentGroup?: string;
}

/**
 * A type with describes settings with depends on a portfolio
 */
export interface PortfolioDependentSettings extends WidgetSettings {
  portfolio: string;
  exchange: string;
}
