import { createAction, props } from '@ngrx/store';
import { Instrument } from '../../shared/models/instruments/instrument.model';

export const selectNewInstrument = createAction('[Instruments] SelectNewInstrument', props<{ instrument: Instrument }>());
