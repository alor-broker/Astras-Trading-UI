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
import { VerticalOrderBookSettings } from "../models/settings/vertical-order-book-settings.model";

/**
 * A type with describes settings with depends on an instrument
 */
export type InstrumentDependentSettings = AnySettings & {
  symbol: string;
  exchange: string;
  instrumentGroup?: string;
  linkedToActive: boolean;
};

/**
 * A type with describes settings with depends on a portfolio
 */
export type PortfolioDependentSettings = AnySettings & {
  portfolio: string;
  exchange: string;
  linkedToActive: boolean;
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
 * A guard which checks if settings depends on an orderbook settings
 * @param settings Settings to check
 */
export function isOrderbookSettings(
  settings: AnySettings
): settings is OrderbookSettings {
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
 * A guard which checks if settings depends on a vertical orderbook settings
 * @param settings Settings to check
 */
export function isVerticalOrderBookSettings(
  settings: AnySettings
): settings is VerticalOrderBookSettings {
  return (
    settings &&
    settings.settingsType === 'VerticalOrderBookSettings' &&
    'linkToActive' in settings &&
    'symbol' in settings &&
    'exchange' in settings &&
    'depth' in settings &&
    'showYieldForBonds' in settings &&
    'showZeroVolumeItems' in settings &&
    'showSpreadItems' in settings &&
    'highlightHighVolume' in settings &&
    'volumeHighlightOptions' in settings
  );
}
/**
 * A guard which checks if settings depends is an lightchart settings
 * @param settings Settings to check
 */
export function isLightChartSettings(
  settings: AnySettings
): settings is LightChartSettings {
  return (
    settings &&
    'linkToActive' in settings &&
    'symbol' in settings &&
    'exchange' in settings &&
    'timeFrame' in settings
  );
}
/**
 * A guard which checks if settings depends is a blotter settings
 * @param settings Settings to check
 */
export function isBlotterSettings(
  settings: AnySettings
): settings is BlotterSettings {
  return (
    settings &&
    'linkToActive' in settings &&
    'portfolio' in settings &&
    'exchange' in settings &&
    'activeTabIndex' in settings
  );
}
/**
 * A guard which checks if settings depends is an info settings
 * @param settings Settings to check
 */
export function isInfoSettings(
  settings: AnySettings
): settings is InfoSettings {
  return (
    settings &&
    'linkToActive' in settings &&
    'isin' in settings
  );
}
/**
 * A guard which checks if settings depends is news settings
 * @param settings Settings to check
 */
export function isNewsSettings(settings: AnySettings): settings is NewsSettings {
  return settings && settings.title === 'Новости';
}

/**
 * A guard which checks if settings depends is all-trades settings
 * @param settings Settings to check
 */
export function isAllTradesSettings(settings: AnySettings): settings is AllTradesSettings {
  return settings && !!settings.title?.includes('Все сделки');
}

/**
 * A guard which checks if settings depends is instrument-select settings
 * @param settings Settings to check
 */
export function isInstrumentSelectSettings(
  settings: AnySettings
): settings is InstrumentSelectSettings {
  return (
    settings &&
    'activeListId' in settings
  );
}

/**
 * A guard which checks if settings depends is echange-rate settings
 * @param settings Settings to check
 */
export function isExchangeRateSettings(settings: AnySettings): settings is ExchangeRateSettings {
  return settings && !!settings.title?.includes('Курс валют');
}

/**
 * Checks the equality of settings by value
 * @param settings1 first settings
 * @param settings2 second settings
 * @returns true if they are equal, false if not
 */
export function isEqual(settings1: AnySettings, settings2: AnySettings) : boolean {
  if (isOrderbookSettings(settings1) && isOrderbookSettings(settings2)) {
    return isEqualOrderbookSettings(settings1, settings2);
  }
  if (isVerticalOrderBookSettings(settings1) && isVerticalOrderBookSettings(settings2)) {
    return isEqualVerticalOrderKookSettings(settings1, settings2);
  }
  if (isLightChartSettings(settings1) && isLightChartSettings(settings2)) {
    return isEqualLightChartSettings(settings1, settings2);
  }
  if (isBlotterSettings(settings1) && isBlotterSettings(settings2)) {
    return isEqualBlotterSettings(settings1, settings2);
  }
  if (isInfoSettings(settings1) && isInfoSettings(settings2)) {
    return isEqualInfoSettings(settings1, settings2);
  }
  if (isInstrumentSelectSettings(settings1) && isInstrumentSelectSettings(settings2)) {
    return isEqualInstrumentSelectSettings(settings1, settings2);
  }

  return (
    settings1.guid == settings2.guid && settings1.title == settings2.title
  );
}
/**
 * Returns a widget name by settings type
 * @param settings Settings
 * @returns widget name
 */
export function getTypeBySettings(settings: AnySettings) {
  if (isOrderbookSettings(settings)) {
    return WidgetNames.orderBook;
  }
  if (isVerticalOrderBookSettings(settings)) {
    return WidgetNames.verticalOrderBook;
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
  return WidgetNames.instrumentSelect;
}

/**
 * Checks if orderbook settings are equal
 * @param settings1 first settings
 * @param settings2 second settings
 * @returns true is equal, false if not
 */
export function isEqualOrderbookSettings(
  settings1: OrderbookSettings,
  settings2: OrderbookSettings
) : boolean {
  if (settings1 && settings2) {
    return (
      settings1.guid == settings2.guid &&
      settings1.symbol == settings2.symbol &&
      settings1.instrumentGroup == settings2.instrumentGroup &&
      settings1.linkToActive == settings2.linkToActive &&
      settings1.exchange == settings2.exchange &&
      settings1.depth == settings2.depth &&
      settings1.showChart == settings2.showChart &&
      settings1.showTable == settings2.showTable &&
      settings1.showYieldForBonds == settings2.showYieldForBonds
    );
  } else return false;
}

/**
 * Checks if vertical orderbook settings are equal
 * @param settings1 first settings
 * @param settings2 second settings
 * @returns true is equal, false if not
 */
export function isEqualVerticalOrderKookSettings(
  settings1: VerticalOrderBookSettings,
  settings2: VerticalOrderBookSettings
) : boolean {
  if (settings1 && settings2) {
    return (
      settings1.guid == settings2.guid &&
      settings1.symbol == settings2.symbol &&
      settings1.instrumentGroup == settings2.instrumentGroup &&
      settings1.linkToActive == settings2.linkToActive &&
      settings1.exchange == settings2.exchange &&
      settings1.depth == settings2.depth &&
      settings1.showYieldForBonds == settings2.showYieldForBonds &&
      settings1.showZeroVolumeItems == settings2.showZeroVolumeItems &&
      settings1.showSpreadItems == settings2.showSpreadItems &&
      settings1.highlightHighVolume == settings2.highlightHighVolume &&
      isArrayEqual(
        settings1.volumeHighlightOptions,
        settings2.volumeHighlightOptions,
        (a, b) => a.boundary === b.boundary && a.color === b.color
      )
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
      settings1.height == settings2.height
    );
  } else return false;
}

/**
 * Checks if blotter settings are equal
 * @param settings1 first settings
 * @param settings2 second settings
 * @returns true is equal, false if not
 */
export function isEqualBlotterSettings(
  settings1?: BlotterSettings,
  settings2?: BlotterSettings
) {
  if (settings1 && settings2) {
    return (
      settings1.linkToActive == settings2.linkToActive &&
      settings1.exchange == settings2.exchange &&
      settings1.portfolio == settings2.portfolio &&
      settings1.guid == settings2.guid &&
      isArrayEqual(settings1.ordersColumns, settings2.ordersColumns, (a, b) => a === b) &&
      isArrayEqual(settings1.stopOrdersColumns, settings2.stopOrdersColumns, (a, b) => a === b) &&
      isArrayEqual(settings1.positionsColumns, settings2.positionsColumns, (a, b) => a === b) &&
      isArrayEqual(settings1.tradesColumns, settings2.tradesColumns, (a, b) => a === b)
    );
  } else return false;
}

/**
 * Checks if instrument-select settings are equal
 * @param settings1 first settings
 * @param settings2 second settings
 * @returns true is equal, false if not
 */
export function isEqualInstrumentSelectSettings(
  settings1?: InstrumentSelectSettings,
  settings2?: InstrumentSelectSettings
) {
  if (settings1 && settings2) {
    return (
      settings1.linkToActive == settings2.linkToActive &&
      settings1.guid == settings2.guid &&
      settings1.activeListId == settings2.activeListId &&
      settings1.instrumentColumns == settings2.instrumentColumns
    );
  } else return false;
}

/**
 * Checks if info settings are equal
 * @param settings1 first settings
 * @param settings2 second settings
 * @returns true is equal, false if not
 */
export function isEqualInfoSettings(
  settings1?: InfoSettings,
  settings2?: InfoSettings
) {
  if (settings1 && settings2) {
    return (
      settings1.linkToActive == settings2.linkToActive &&
      settings1.guid == settings2.guid &&
      settings1.symbol == settings2.symbol &&
      settings1.exchange == settings2.exchange
    );
  } else return false;
}
