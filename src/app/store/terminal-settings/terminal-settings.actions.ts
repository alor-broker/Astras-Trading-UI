import { createAction, props } from '@ngrx/store';
import { TerminalSettings } from '../../shared/models/terminal-settings/terminal-settings.model';

export const initTerminalSettings = createAction(
  '[TerminalSettings] Init Settings'
);

export const initTerminalSettingsSuccess = createAction(
  '[TerminalSettings] Init Settings (SUCCESS)',
  props<{ settings: TerminalSettings }>()
);

export const updateTerminalSettings = createAction(
  '[TerminalSettings] Update Settings',
  props<{ updates: Partial<TerminalSettings> }>()
);




