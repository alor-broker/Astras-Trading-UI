import {
  EnvironmentProviders,
  makeEnvironmentProviders
} from '@angular/core';
import {WidgetLocalStateService} from './widget-local-state.service';
import {provideState} from '@ngrx/store';
import {WidgetsLocalStatesFeature} from './store/reducer';
import {provideEffects} from '@ngrx/effects';
import {WidgetsLocalStateEffects} from './store/effects';
import {WidgetsLocalStateBridgeEffects} from './store/bridge-effects';

export function provideWidgetLocalState(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideState(WidgetsLocalStatesFeature),
    provideEffects([
      WidgetsLocalStateEffects,
      WidgetsLocalStateBridgeEffects
    ]),
    WidgetLocalStateService
  ]);
}
