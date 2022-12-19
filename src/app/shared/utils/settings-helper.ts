import { WidgetNames } from '../models/enums/widget-names';
import { AnySettings } from '../models/settings/any-settings.model';
import { BlotterSettings } from '../models/settings/blotter-settings.model';
import { InfoSettings } from '../models/settings/info-settings.model';
import { InstrumentSelectSettings } from '../models/settings/instrument-select-settings.model';
import { LightChartSettings } from '../models/settings/light-chart-settings.model';
import { OrderbookSettings } from '../models/settings/orderbook-settings.model';
import { isArrayEqual } from './collections';
import { NewsSettings } from "../models/settings/news-settings.model";
import { AllTradesSettings } from "../models/settings/all-trades-settings.model";
import { ExchangeRateSettings } from "../models/settings/exchange-rate-settings.model";
import { ScalperOrderBookSettings } from "../models/settings/scalper-order-book-settings.model";
import { TechChartSettings } from "../models/settings/tech-chart-settings.model";
import { AllInstrumentsSettings } from "../models/settings/all-instruments-settings.model";
import { OrderSubmitSettings } from "../models/settings/order-submit-settings.model";
import { InstrumentKey } from '../models/instruments/instrument-key.model';

/**
 * A type with describes settings with depends on an instrument
 */
export type InstrumentDependentSettings = AnySettings & {
  symbol: string;
  exchange: string;
  instrumentGroup?: string;
};

/**
 * A type with describes settings with depends on a portfolio
 */
export type PortfolioDependentSettings = AnySettings & {
  portfolio: string;
  exchange: string;
};

/**
 * A guard which checks if settings depends on an instrument
 * @param settings Settings to check
 */
export function isInstrumentDependent(
  settings: AnySettings
): settings is InstrumentDependentSettings {
  return (
    settings &&
    'linkToActive' in settings &&
    'symbol' in settings &&
    'exchange' in settings
  );
}
/**
 * A guard which checks if settings depends on a portfolio
 * @param settings Settings to check
 */
export function isPortfolioDependent(
  settings: AnySettings
): settings is PortfolioDependentSettings {
  return (
    settings &&
    'linkToActive' in settings &&
    'portfolio' in settings &&
    'exchange' in settings
  );
}
/**
 * A guard which checks if settings is an orderbook settings
 * @param settings Settings to check
 */
export function isOrderbookSettings(
  settings: AnySettings
): settings is OrderbookSettings {
  if(!!settings?.settingsType) {
    return settings.settingsType === 'OrderbookSettings';
  }

  // code below for backward compatibility only;
  return (
    settings &&
    'linkToActive' in settings &&
    'symbol' in settings &&
    'exchange' in settings &&
    'depth' in settings &&
    'showChart' in settings &&
    'showYieldForBonds' in settings &&
    'showTable' in settings
  );
}
/**
 * A guard which checks if settings is a scalper orderbook settings
 * @param settings Settings to check
 */
export function isScalperOrderBookSettings(
  settings: AnySettings
): settings is ScalperOrderBookSettings {
  if(!!settings?.settingsType) {
    return settings.settingsType === 'ScalperOrderBookSettings';
  }

  // code below for backward compatibility only;
  return (
    settings &&
    settings.settingsType === 'ScalperOrderBookSettings' &&
    'linkToActive' in settings &&
    'symbol' in settings &&
    'exchange' in settings &&
    'depth' in settings &&
    'showYieldForBonds' in settings &&
    'showZeroVolumeItems' in settings &&
    'showSpreadItems' in settings &&
    'volumeHighlightMode' in settings &&
    'volumeHighlightOptions' in settings &&
    'workingVolumes' in settings &&
    'disableHotkeys' in settings &&
    'enableMouseClickSilentOrders' in settings
  );
}

/**
 * A guard which checks if settings is a lightchart settings
 * @param settings Settings to check
 */
export function isLightChartSettings(
  settings: AnySettings
): settings is LightChartSettings {
  if(!!settings?.settingsType) {
    return settings.settingsType === 'LightChartSettings';
  }

  // code below for backward compatibility only;
  return (
    settings &&
    'linkToActive' in settings &&
    'symbol' in settings &&
    'exchange' in settings &&
    'timeFrame' in settings
  );
}

/**
 * A guard which checks if settings is a blotter settings
 * @param settings Settings to check
 */
export function isBlotterSettings(
  settings: AnySettings
): settings is BlotterSettings {
  if(!!settings?.settingsType) {
    return settings.settingsType === 'BlotterSettings';
  }

  // code below for backward compatibility only;
  return (
    settings &&
    'linkToActive' in settings &&
    'portfolio' in settings &&
    'exchange' in settings &&
    'activeTabIndex' in settings
  );
}

/**
 * A guard which checks if settings is an info settings
 * @param settings Settings to check
 */
export function isInfoSettings(
  settings: AnySettings
): settings is InfoSettings {
  if(!!settings?.settingsType) {
    return settings.settingsType === 'InfoSettings';
  }

  // code below for backward compatibility only;
  return (
    settings &&
    'linkToActive' in settings &&
    'isin' in settings
  );
}

/**
 * A guard which checks if settings is a news settings
 * @param settings Settings to check
 */
export function isNewsSettings(settings: AnySettings): settings is NewsSettings {
  if(!!settings?.settingsType) {
    return settings.settingsType === 'NewsSettings';
  }

  // code below for backward compatibility only;
  return settings && settings.title === 'Новости';
}

/**
 * A guard which checks if settings is an all-trades settings
 * @param settings Settings to check
 */
export function isAllTradesSettings(settings: AnySettings): settings is AllTradesSettings {
  if(!!settings?.settingsType) {
    return settings.settingsType === 'AllTradesSettings';
  }

  // code below for backward compatibility only;
  return settings && !!settings.title?.includes('Всe сделки');
}

/**
 * A guard which checks if settings is an instrument-select settings
 * @param settings Settings to check
 */
export function isInstrumentSelectSettings(
  settings: AnySettings
): settings is InstrumentSelectSettings {
  if(!!settings?.settingsType) {
    return settings.settingsType === 'InstrumentSelectSettings';
  }

  // code below for backward compatibility only;
  return (
    settings &&
    'activeListId' in settings
  );
}

/**
 * A guard which checks if settings is an exchange-rate settings
 * @param settings Settings to check
 */
export function isExchangeRateSettings(settings: AnySettings): settings is ExchangeRateSettings {
  if(!!settings?.settingsType) {
    return settings.settingsType === 'ExchangeRateSettings';
  }

  // code below for backward compatibility only;
  return settings && !!settings.title?.includes('Курс валют');
}

/**
 * A guard which checks if settings is an tech chart settings
 * @param settings Settings to check
 */
export function isTechChartSettings(settings: AnySettings): settings is TechChartSettings {
  return settings.settingsType === 'TechChartSettings';
}

/**
 * A guard which checks if settings is an all-instruments settings
 * @param settings Settings to check
 */
export function isAllInstrumentsSettings(settings: AnySettings): settings is AllInstrumentsSettings {
  return settings.settingsType === 'AllInstrumentsSettings';
}

/**
 * A guard which checks if settings is an order submit settings
 * @param settings Settings to check
 */
export function isOrderSubmitSettings(settings: AnySettings): settings is OrderSubmitSettings {
  return settings.settingsType === 'OrderSubmitSettings';
}

export function getTypeBySettings(settings: AnySettings): WidgetNames | null {
  if (isInstrumentSelectSettings(settings)) {
    return WidgetNames.instrumentSelect;
  }

  if (isOrderbookSettings(settings)) {
    return WidgetNames.orderBook;
  }
  if (isScalperOrderBookSettings(settings)) {
    return WidgetNames.scalperOrderBook;
  }
  if (isLightChartSettings(settings)) {
    return WidgetNames.lightChart;
  }
  if (isBlotterSettings(settings)) {
    return WidgetNames.blotter;
  }
  if (isAllTradesSettings(settings)) {
    return WidgetNames.allTrades;
  }
  if (isExchangeRateSettings(settings)) {
    return WidgetNames.exchangeRate;
  }
  if (isInfoSettings(settings)) {
    return WidgetNames.instrumentInfo;
  }
  if (isNewsSettings(settings)) {
    return WidgetNames.news;
  }
  if (isTechChartSettings(settings)) {
    return WidgetNames.techChart;
  }
  if (isAllInstrumentsSettings(settings)) {
    return WidgetNames.allInstruments;
  }

  if (isOrderSubmitSettings(settings)) {
    return WidgetNames.orderSubmit;
  }

  return null;
}

/**
 * Checks if scalper orderbook settings are equal
 * @param settings1 first settings
 * @param settings2 second settings
 * @returns true is equal, false if not
 */
export function isEqualScalperOrderBookSettings(
  settings1: ScalperOrderBookSettings,
  settings2: ScalperOrderBookSettings
) : boolean {
  if (settings1 && settings2) {
      return (
      settings1.badgeColor == settings2.badgeColor &&
      settings1.guid == settings2.guid &&
      settings1.symbol == settings2.symbol &&
      settings1.instrumentGroup == settings2.instrumentGroup &&
      settings1.linkToActive == settings2.linkToActive &&
      settings1.exchange == settings2.exchange &&
      settings1.depth == settings2.depth &&
      settings1.showZeroVolumeItems == settings2.showZeroVolumeItems &&
      settings1.showSpreadItems == settings2.showSpreadItems &&
      settings1.volumeHighlightMode == settings2.volumeHighlightMode &&
      isArrayEqual(
        settings1.volumeHighlightOptions,
        settings2.volumeHighlightOptions,
        (a, b) => a.boundary === b.boundary && a.color === b.color
      ) &&
      isArrayEqual(
        settings1.workingVolumes,
        settings2.workingVolumes,
        (a, b) => a === b
      ) &&
      settings1.disableHotkeys == settings2.disableHotkeys &&
      settings1.enableMouseClickSilentOrders == settings2.enableMouseClickSilentOrders &&
      settings1.autoAlignIntervalSec == settings2.autoAlignIntervalSec
    );
  } else return false;
}

/**
 * Checks if lightchart settings are equal
 * @param settings1 first settings
 * @param settings2 second settings
 * @returns true is equal, false if not
 */
export function isEqualLightChartSettings(
  settings1?: LightChartSettings,
  settings2?: LightChartSettings
) {
  if (settings1 && settings2) {
    return (
      settings1.symbol == settings2.symbol &&
      settings1.instrumentGroup == settings2.instrumentGroup &&
      settings1.linkToActive == settings2.linkToActive &&
      settings1.exchange == settings2.exchange &&
      settings1.timeFrame == settings2.timeFrame &&
      settings1.guid == settings2.guid &&
      settings1.width == settings2.width &&
      settings1.height == settings2.height &&
      settings1.badgeColor == settings2.badgeColor &&
      settings1.timeFrameDisplayMode == settings2.timeFrameDisplayMode
    );
  } else return false;
}

/**
 * Checks if tech chart settings are equal
 * @param settings1 first settings
 * @param settings2 second settings
 * @returns true is equal, false if not
 */
export function isEqualTechChartSettings(
  settings1?: TechChartSettings,
  settings2?: TechChartSettings
) {
  if (settings1 && settings2) {
    return (
      settings1.linkToActive == settings2.linkToActive &&
      settings1.guid == settings2.guid &&
      settings1.symbol == settings2.symbol &&
      settings1.exchange == settings2.exchange &&
      settings1.chartSettings == settings2.chartSettings &&
      settings1.badgeColor == settings2.badgeColor
    );
  } else return false;
}

/**
 * Checks if order submit settings are equal
 * @param settings1 first settings
 * @param settings2 second settings
 * @returns true is equal, false if not
 */
export function isEqualOrderSubmitSettings(
  settings1?: OrderSubmitSettings,
  settings2?: OrderSubmitSettings
) {
  if (settings1 && settings2) {
    return (
      settings1.linkToActive == settings2.linkToActive &&
      settings1.guid == settings2.guid &&
      settings1.symbol == settings2.symbol &&
      settings1.exchange == settings2.exchange &&
      settings1.enableLimitOrdersFastEditing == settings2.enableLimitOrdersFastEditing &&
      isArrayEqual(settings1.limitOrderPriceMoveSteps, settings2.limitOrderPriceMoveSteps, (a, b) => a === b) &&
      settings1.showVolumePanel == settings2.showVolumePanel &&
      isArrayEqual(settings1.workingVolumes, settings2.workingVolumes, (a, b) => a === b)
    );
  } else return false;
}

/**
 * Checks if portfolio depended settings are equal
 * @param settings1 first settings
 * @param settings2 second settings
 * @returns true is equal, false if not
 */
export function isEqualPortfolioDependedSettings(settings1?: PortfolioDependentSettings | null, settings2?: PortfolioDependentSettings | null) {
  return settings1?.portfolio === settings2?.portfolio
    && settings1?.exchange == settings2?.exchange
    && settings1?.linkToActive == settings2?.linkToActive
    && settings1?.badgeColor == settings2?.badgeColor;
}

/**
 * Checks if instrument keys are equal
 * @param settings1 first settings
 * @param settings2 second settings
 * @returns true is equal, false if not
 */
export function isInstrumentEqual(settings1?: InstrumentKey | null, settings2?: InstrumentKey | null) {
  return settings1?.symbol === settings2?.symbol
    && settings1?.instrumentGroup === settings2?.instrumentGroup
    && settings1?.exchange == settings2?.exchange;
}
