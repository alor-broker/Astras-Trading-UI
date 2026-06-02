import {
  EnvironmentProviders,
  makeEnvironmentProviders
} from '@angular/core';
import {provideState} from '@ngrx/store';
import {PortfoliosFeature} from './store/reducer';
import {provideEffects} from '@ngrx/effects';
import {PortfoliosEffects} from './store/effects';
import {PortfoliosStoreFacade} from './store/portfolios-store-facade';

export function providePortfoliosStorage(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideState(PortfoliosFeature),
    provideEffects(PortfoliosEffects),
    PortfoliosStoreFacade
  ]);
}
