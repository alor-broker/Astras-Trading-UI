import {InstrumentKey} from '../../../common/types/instrument.types';
import {InjectionToken} from '@angular/core';

export interface ActionsContext {
  selectInstrument(instrumentKey: InstrumentKey, groupKey: string): void;
}

export const ACTIONS_CONTEXT = new InjectionToken<ActionsContext>('ActionsContext');
