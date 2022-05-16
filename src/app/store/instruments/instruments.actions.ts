import { createAction, props } from '@ngrx/store';
import { InstrumentKey } from 'src/app/shared/models/instruments/instrument-key.model';
import { Instrument } from '../../shared/models/instruments/instrument.model';

export const selectNewInstrumentName = '[Instruments] SelectNewInstrument';
export const newInstrumentSelectedName = '[Instruments] NewInstrumentSelected';

export const selectNewInstrument = createAction(selectNewInstrumentName, props<{ instrument: InstrumentKey }>());
export const newInstrumentSelected = createAction(newInstrumentSelectedName, props<{ instrument: Instrument }>());
