import {
  createActionGroup,
  emptyProps,
  props
} from '@ngrx/store';
import { TerminalSettings } from '../../shared/models/terminal-settings/terminal-settings.model';

export const TerminalSettingsInternalActions = createActionGroup({
  source: 'TerminalSettings/Internal',
  events: {
    "Init": props<{ settings: TerminalSettings | null }>(),
    "Init Success": props<{ settings: TerminalSettings }>()
  }
});

export const TerminalSettingsServicesActions = createActionGroup({
  source: 'TerminalSettings/Services',
  events: {
    "Update": props<{ updates: Partial<TerminalSettings>, freezeChanges: boolean }>(),
    "Reset": emptyProps()
  }
});

export const TerminalSettingsEventsActions = createActionGroup({
  source: 'TerminalSettings/Events',
  events: {
    "Save Success": emptyProps(),
    "Reset Success": emptyProps()
  }
});
