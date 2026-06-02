import {
  EnvironmentProviders,
  makeEnvironmentProviders
} from '@angular/core';
import {provideState} from '@ngrx/store';
import {provideEffects} from '@ngrx/effects';
import {TerminalSettingsFeature} from './store/reducer';
import {TerminalSettingsEffects} from './store/effects';
import {TerminalSettingsBridgeEffects} from './store/bridge-effects';
import {TerminalSettingsService} from './services/terminal-settings.service';

export function provideTerminalSettingsStorage(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideState(TerminalSettingsFeature),
    provideEffects([
        TerminalSettingsEffects,
        TerminalSettingsBridgeEffects
      ]
    ),
    TerminalSettingsService
  ]);
}
