import {
  InstrumentDependentSettings,
  PortfolioDependentSettings,
  WidgetSettings
} from '../widget-settings.types';


export class WidgetSettingsHelper {
  /**
   * A guard which checks if settings depends on an instrument
   * @param settings Settings to check
   */
  static isInstrumentDependent(
    settings: WidgetSettings
  ): settings is InstrumentDependentSettings {
    return (
      'linkToActive' in settings &&
      'symbol' in settings &&
      'exchange' in settings
    );
  }

  /**
   * A guard which checks if settings depends on a portfolio
   * @param settings Settings to check
   */
  static isPortfolioDependent(
    settings: WidgetSettings
  ): settings is PortfolioDependentSettings {
    return (
      'linkToActive' in settings &&
      'portfolio' in settings &&
      'exchange' in settings
    );
  }

  /**
   * Checks if portfolio depended on settings are equal
   * @param settings1 first settings
   * @param settings2 second settings
   * @returns true is equal, false if not
   */
  static isEqualPortfolioDependedSettings(settings1?: PortfolioDependentSettings | null, settings2?: PortfolioDependentSettings | null): boolean {
    return settings1?.portfolio === settings2?.portfolio
      && settings1?.exchange == settings2?.exchange
      && settings1?.linkToActive == settings2?.linkToActive
      && settings1?.badgeColor == settings2?.badgeColor;
  }
}
