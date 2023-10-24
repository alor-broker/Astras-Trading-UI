import {
  createActionGroup,
  props
} from '@ngrx/store';

import { WidgetStateRecord, } from './widgets-local-state.model';

export const WidgetsLocalStateActions = createActionGroup({
  source: 'WidgetsLocalState/API',
  events: {
    //  'Load WidgetsLocalStates': props<{ widgetsLocalStates: WidgetLocalState[] }>(),
    'Set WidgetLocalState Record': props<{ record: WidgetStateRecord }>(),
    //  'Upsert WidgetsLocalState': props<{ widgetsLocalState: WidgetLocalState }>(),
    //  'Add WidgetsLocalStates': props<{ widgetsLocalStates: WidgetLocalState[] }>(),
    //  'Upsert WidgetsLocalStates': props<{ widgetsLocalStates: WidgetLocalState[] }>(),
    //  'Update WidgetsLocalState': props<{ widgetsLocalState: Update<WidgetLocalState> }>(),
    // 'Update WidgetsLocalStates': props<{ widgetsLocalStates: Update<WidgetLocalState>[] }>(),
    // 'Delete WidgetsLocalState': props<{ id: string }>(),
    // 'Delete WidgetsLocalStates': props<{ ids: string[] }>(),
    // 'Clear WidgetsLocalStates': emptyProps(),
  }
});
