import { createAction, props } from '@ngrx/store';
import { Instrument } from '../../models/instruments/instrument.model';

export const selectInstrument = createAction('[Instruments] SelectInstrument', props<{ instrument: Instrument }>());
