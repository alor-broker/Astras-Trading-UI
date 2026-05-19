import {
  createActionGroup,
  emptyProps,
  props
} from '@ngrx/store';
import {WidgetSettings} from '../widget-settings.types';
import {InstrumentKey} from '../../../common/types/instrument.types';
import {PortfolioKey} from '../../../common/types/portfolio.types';

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
