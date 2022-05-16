import { createAction, props } from '@ngrx/store';
import { InstrumentKey } from 'src/app/shared/models/instruments/instrument-key.model';
import { Instrument } from '../../shared/models/instruments/instrument.model';

export const selectNewInstrument = createAction('[Instruments] SelectNewInstrument', props<{ instrument: InstrumentKey }>());
export const newInstrumentSelected = createAction('[Instruments] NewInstrumentSelected', props<{ instrument: Instrument }>());
