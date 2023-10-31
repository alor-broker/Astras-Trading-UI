import {
  createActionGroup,
  emptyProps,
  props
} from '@ngrx/store';

import { WidgetStateRecord, } from './widgets-local-state.model';

export const WidgetsLocalStateActions = createActionGroup({
  source: 'WidgetsLocalState',
  events: {
    'Init': emptyProps(),
    'Load': props<{ records: WidgetStateRecord[] }>(),
    'Set Record': props<{ record: WidgetStateRecord }>(),
    'Remove For Widgets': props<{ widgetsGuids: string[] }>(),
  }
});
