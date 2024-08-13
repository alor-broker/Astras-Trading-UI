import {
  createActionGroup,
  emptyProps,
  props
} from '@ngrx/store';
import { InstrumentKey } from "../../shared/models/instruments/instrument-key.model";
import { PortfolioKey } from "../../shared/models/portfolio-key.model";
import { WidgetSettings } from '../../shared/models/widget-settings.model';

export const WidgetSettingsInternalActions = createActionGroup({
  source: 'WidgetSettings/Internal',
  events: {
    "Init": props<{ settings: WidgetSettings[] }>(),
    "Set Default Badges": props<{ settingGuids: string[] }>(),
  }
});

export const WidgetSettingsServiceActions = createActionGroup({
  source: 'WidgetSettings/Services',
  events: {
    "Add": props<{ settings: WidgetSettings[] }>(),
    "Update Instrument": props<{ updates: { guid: string, instrumentKey: InstrumentKey }[] }>(),
    "Update Portfolio": props<{ settingGuids: string[], newPortfolioKey: PortfolioKey }>(),
    "Update Content": props<{ settingGuid: string, changes: Partial<WidgetSettings> }>(),
    "Remove": props<{ settingGuids: string[] }>(),
    "Remove All": emptyProps()
  }
});

export const WidgetSettingsEventsActions = createActionGroup({
  source: 'WidgetSettings/Events',
  events: {
    Updated: props<{ settings: WidgetSettings[] }>()
  }
});
