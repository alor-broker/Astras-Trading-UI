import {
  createFeature,
  createReducer,
  on
} from '@ngrx/store';
import { EntityStatus } from '../../shared/models/enums/entity-status';
import { TerminalSettings } from '../../shared/models/terminal-settings/terminal-settings.model';
import {
  TerminalSettingsInternalActions,
  TerminalSettingsServicesActions
} from "./terminal-settings.actions";

enum FrozenStatus {
  Frozen = 'Frozen'
}

type TerminalSettingsEntityStatus = EntityStatus | FrozenStatus;

export interface State {
  status: TerminalSettingsEntityStatus;
  settings: TerminalSettings | null;
}

const initialState: State = {
  status: EntityStatus.Initial,
  settings: null
};

const reducer = createReducer(
  initialState,

  on(TerminalSettingsInternalActions.init, (state) => ({
    ...state,
    status: EntityStatus.Loading
  })),

  on(TerminalSettingsInternalActions.initSuccess, (state, { settings }) => ({
    ...state,
    status: EntityStatus.Success,
    settings: {
      ...settings
    }

  })),

  on(TerminalSettingsServicesActions.update, (state, { updates, freezeChanges }) => ({
    ...state,
    status: freezeChanges ? FrozenStatus.Frozen : EntityStatus.Success,
    settings: {
      ...state.settings,
      ...updates
    }
  })),

  on(TerminalSettingsServicesActions.reset, (state) => ({
    ...state,
    status: FrozenStatus.Frozen
  }))
);

export const TerminalSettingsFeature = createFeature({
  name: 'TerminalSettings',
  reducer
});
