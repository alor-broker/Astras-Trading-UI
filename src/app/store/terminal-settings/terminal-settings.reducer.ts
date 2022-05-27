import { createReducer, on } from '@ngrx/store';
import * as TerminalSettingsActions from './terminal-settings.actions';
import { EntityStatus } from '../../shared/models/enums/entity-status';
import { TerminalSettings } from '../../shared/models/terminal-settings/terminal-settings.model';

export const terminalSettingsFeatureKey = 'terminalSettings';

export interface State {
  status: EntityStatus,
  settings?: TerminalSettings
}

export const initialState: State = {
  status: EntityStatus.Initial,
  settings: undefined
};

export const reducer = createReducer(
  initialState,

  on(TerminalSettingsActions.initTerminalSettings, (state) => ({
    ...state,
    status: EntityStatus.Loading
  })),

  on(TerminalSettingsActions.initTerminalSettingsSuccess, (state, { settings }) => ({
    ...state,
    status: EntityStatus.Success,
    settings: {
      ...settings
    }

  })),

  on(TerminalSettingsActions.updateTerminalSettings, (state, { updates }) => ({
    ...state,
    settings: {
      ...state.settings,
      ...updates
    }
  })),
);
