import {
  createActionGroup,
  props
} from '@ngrx/store';
import {WidgetStateRecord} from '../widget-local-state.types';

export const WidgetsLocalStateInternalActions = createActionGroup({
  source: 'WidgetsLocalState/Internal',
  events: {
    'Init': props<{ storageKey: string }>(),
    'Load': props<{ records: WidgetStateRecord[] }>(),
    'Clear For Widgets': props<{ widgetsGuids: string[] }>(),
  }
});

export const WidgetsLocalStateServicesActions = createActionGroup({
  source: 'WidgetsLocalState/Services',
  events: {
    'Set Record': props<{ record: WidgetStateRecord }>()
  }
});
