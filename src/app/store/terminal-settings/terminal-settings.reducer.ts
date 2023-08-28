import {createReducer, on} from '@ngrx/store';
import {EntityStatus} from '../../shared/models/enums/entity-status';
import {TerminalSettings} from '../../shared/models/terminal-settings/terminal-settings.model';
import {InternalTerminalSettingsActions, TerminalSettingsActions} from "./terminal-settings.actions";

export const terminalSettingsFeatureKey = 'terminalSettings';

enum FrozenStatus {
  Frozen = 'Frozen'
}

type TerminalSettingsEntityStatus = EntityStatus | FrozenStatus;

export interface State {
  status: TerminalSettingsEntityStatus,
  settings?: TerminalSettings
}

const initialState: State = {
  status: EntityStatus.Initial,
  settings: undefined
};

export const reducer = createReducer(
  initialState,

  on(TerminalSettingsActions.initTerminalSettings, (state) => ({
    ...state,
    status: EntityStatus.Loading
  })),

  on(InternalTerminalSettingsActions.initTerminalSettingsSuccess, (state, {settings}) => ({
    ...state,
    status: EntityStatus.Success,
    settings: {
      ...settings
    }

  })),

  on(TerminalSettingsActions.updateTerminalSettings, (state, {updates, freezeChanges}) => ({
    ...state,
    status: freezeChanges ? FrozenStatus.Frozen : EntityStatus.Success,
    settings: {
      ...state.settings,
      ...updates
    }
  })),

  on(TerminalSettingsActions.reset, (state) => ({
    ...state,
    status: FrozenStatus.Frozen
  }))
);
