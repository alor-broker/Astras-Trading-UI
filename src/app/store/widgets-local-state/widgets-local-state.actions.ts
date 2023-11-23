import {
  createActionGroup,
  emptyProps,
  props
} from '@ngrx/store';

import { WidgetStateRecord, } from './widgets-local-state.model';

export const WidgetsLocalStateInternalActions = createActionGroup({
  source: 'WidgetsLocalState/Internal',
  events: {
    'Init': emptyProps(),
    'Load': props<{ records: WidgetStateRecord[] }>(),
    'Remove For Widgets': props<{ widgetsGuids: string[] }>(),
  }
});

export const WidgetsLocalStateServicesActions = createActionGroup({
  source: 'WidgetsLocalState/Services',
  events: {
    'Set Record': props<{ record: WidgetStateRecord }>()
  }
});
