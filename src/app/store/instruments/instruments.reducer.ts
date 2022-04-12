import { createReducer, on } from '@ngrx/store';
import * as InstrumentsActions from './instruments.actions';
import { Instrument } from '../../shared/models/instruments/instrument.model';

export const instrumentsFeatureKey = 'instruments';

export interface InstrumentsState {
  selectedInstrument: Instrument;
}

export const initialState: InstrumentsState = {
  selectedInstrument: {
    symbol: 'SBER',
    exchange: 'MOEX',
    instrumentGroup: 'TQBR',
    isin: 'RU0009029540'
  }
};

export const reducer = createReducer(
  initialState,

  on(InstrumentsActions.selectNewInstrument, (state, { instrument }) => ({
      ...state,
      selectedInstrument: {
        ...instrument
      }
    })
  )
);
