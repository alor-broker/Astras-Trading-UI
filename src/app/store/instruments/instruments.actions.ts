import { createAction, props } from '@ngrx/store';
import { InstrumentKey } from 'src/app/shared/models/instruments/instrument-key.model';
import { Instrument } from '../../shared/models/instruments/instrument.model';

export const selectNewInstrumentByBadge = createAction('[Instruments] selectNewInstrumentByBadge', props<{ instrument: InstrumentKey, badgeColor?: string }>());
export const newInstrumentByBadgeSelected = createAction('[Instruments] newInstrumentByBadgeSelected', props<{ instrument: Instrument, badgeColor: string }>());
