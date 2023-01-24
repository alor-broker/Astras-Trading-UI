import {
  createAction,
  props
} from '@ngrx/store';
import { AnySettings } from "../../shared/models/settings/any-settings.model";
import { InstrumentKey } from "../../shared/models/instruments/instrument-key.model";
import { PortfolioKey } from "../../shared/models/portfolio-key.model";

export const initWidgetSettings = createAction(
  '[WidgetSettings] Init Settings'
);

export const initWidgetSettingsSuccess = createAction(
  '[WidgetSettings] Init Settings (SUCCESS)',
  props<{ settings: AnySettings[] }>()
);

export const addWidgetSettings = createAction(
  '[WidgetSettings] Add Widget Settings',
  props<{ settings: AnySettings[] }>()
);

export const updateWidgetSettingsInstrument = createAction(
  '[WidgetSettings] Update Widget Settings Instrument',
  props<{ updates: { guid: string, instrumentKey: InstrumentKey }[] }>()
);

export const setDefaultBadges = createAction(
  '[WidgetSettings] Set Widget Settings To Default Badges',
  props<{ settingGuids: string[] }>()
);

export const updateWidgetSettingsPortfolio = createAction(
  '[WidgetSettings] Update Widget Settings Portfolio',
  props<{ settingGuids: string[], newPortfolioKey: PortfolioKey }>()
);

export const updateWidgetSettings = createAction(
  '[WidgetSettings] Update Widget Settings',
  props<{ settingGuid: string, changes: Partial<AnySettings> }>()
);

export const removeWidgetSettings = createAction(
  '[WidgetSettings] Remove Widget Settings',
  props<{ settingGuids: string[] }>()
);

export const removeAllWidgetSettings = createAction(
  '[WidgetSettings] Remove ALL Widget Settings'
);

export const saveSettings = createAction('[WidgetSettings] Save Settings');




