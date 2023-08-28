import {createAction, props} from '@ngrx/store';
import {TerminalSettings} from '../../shared/models/terminal-settings/terminal-settings.model';

export class TerminalSettingsActions {
  static initTerminalSettings = createAction(
    '[TerminalSettings] Init Settings',
    props<{ settings: TerminalSettings | null }>()
  );

  static updateTerminalSettings = createAction(
    '[TerminalSettings] Update Settings',
    props<{ updates: Partial<TerminalSettings>, freezeChanges: boolean }>()
  );

  static saveTerminalSettingsSuccess = createAction(
    '[TerminalSettings] Save Settings (SUCCESS)'
  );

  static reset = createAction(
    '[TerminalSettings] Reset'
  );

  static resetSuccess = createAction(
    '[TerminalSettings] Reset (SUCCESS)'
  );
}

/**
 These actions can be dispatched only from store effects
 */
export class InternalTerminalSettingsActions {
  static initTerminalSettingsSuccess = createAction(
    '[TerminalSettings] Init Settings (SUCCESS)',
    props<{ settings: TerminalSettings }>()
  );
}






