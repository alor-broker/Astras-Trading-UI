import {
  EnvironmentProviders,
  makeEnvironmentProviders
} from '@angular/core';
import {provideState} from '@ngrx/store';
import {provideEffects} from '@ngrx/effects';
import {WidgetSettingsFeature} from './store/reducer';
import {WidgetSettingsEffects} from './store/effects';
import {WidgetSettingsBridgeEffects} from './store/bridge-effects';
import {WidgetSettingsService} from './services/widget-settings.service';

export function provideWidgetSettingsStorage(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideState(WidgetSettingsFeature),
    provideEffects([
        WidgetSettingsEffects,
        WidgetSettingsBridgeEffects
      ]
    ),
    WidgetSettingsService
  ]);
}
