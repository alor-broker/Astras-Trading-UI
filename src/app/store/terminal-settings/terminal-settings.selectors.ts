import { createFeatureSelector } from '@ngrx/store';
import * as fromTerminalSettings from './terminal-settings.reducer';

export const selectTerminalSettingsState = createFeatureSelector<fromTerminalSettings.State>(
  fromTerminalSettings.terminalSettingsFeatureKey
);
