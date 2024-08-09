import { InstrumentKey } from '../models/instruments/instrument-key.model';
import { WidgetSettingsService } from '../services/widget-settings.service';
import { Observable } from 'rxjs';
import { mapWith } from './observable-helper';
import { map } from 'rxjs/operators';
import { WidgetSettings } from '../models/widget-settings.model';
import {TerminalSettingsService} from "../services/terminal-settings.service";

/**
 * A type with describes settings with depends on an instrument
 */
export type InstrumentDependentSettings = WidgetSettings & {
  symbol: string;
  exchange: string;
  instrumentGroup?: string;
};

/**
 * A type with describes settings with depends on a portfolio
 */
export type PortfolioDependentSettings = WidgetSettings & {
  portfolio: string;
  exchange: string;
};

/**
 * A guard which checks if settings depends on an instrument
 * @param settings Settings to check
 */
export function isInstrumentDependent(
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
export function isPortfolioDependent(
  settings: WidgetSettings
): settings is PortfolioDependentSettings {
  return (
    'linkToActive' in settings &&
    'portfolio' in settings &&
    'exchange' in settings
  );
}

/**
 * Checks if portfolio depended settings are equal
 * @param settings1 first settings
 * @param settings2 second settings
 * @returns true is equal, false if not
 */
export function isEqualPortfolioDependedSettings(settings1?: PortfolioDependentSettings | null, settings2?: PortfolioDependentSettings | null): boolean {
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
export function isInstrumentEqual(settings1?: InstrumentKey | null, settings2?: InstrumentKey | null): boolean {
  return settings1?.symbol === settings2?.symbol
    && settings1?.instrumentGroup === settings2?.instrumentGroup
    && settings1?.exchange == settings2?.exchange;
}

/**
 * Class with settings related functions
 */
export class SettingsHelper {
  static showBadge(
    widgetGuid: string,
    widgetSettingsService: WidgetSettingsService,
    terminalSettingsService: TerminalSettingsService): Observable<boolean> {
    return widgetSettingsService.getSettings(widgetGuid).pipe(
      mapWith(() => terminalSettingsService.getSettings(), (ws, ts) => ({ ws, ts })),
      map(({ ws, ts }) => ts.badgesBind === true && (ws.linkToActive ?? true) && ws.badgeColor != null)
    );
  }
}
