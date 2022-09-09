import { createReducer, on } from '@ngrx/store';
import * as InstrumentsActions from './instruments.actions';
import { Instrument, InstrumentBadges } from '../../shared/models/instruments/instrument.model';
import { instrumentsBadges } from "../../shared/utils/instruments";

export const instrumentsFeatureKey = 'instruments';

export interface InstrumentsState {
  selectedInstrumentWithBadge: InstrumentBadges
}

export const defaultInstrument: Instrument = {
  symbol: 'SBER',
  exchange: 'MOEX',
  instrumentGroup: 'TQBR',
  isin: 'RU0009029540',
  shortName: "Сбербанк АО",
  description: "Сбербанк АО",
  currency: "RUB",
  minstep: 0.01,
  cfiCode: "ESXXXX"
};

export const initialState: InstrumentsState = {
  selectedInstrumentWithBadge: instrumentsBadges.reduce((acc, curr) => {
    acc[curr] = { ...defaultInstrument };
    return acc;
  }, {} as {[badge: string]: Instrument})
};

export const reducer = createReducer(
  initialState,

  on(InstrumentsActions.newInstrumentByBadgeSelected, (state, { instrument, badgeColor}) => ({
    ...state,
    selectedInstrumentWithBadge: {
      ...state.selectedInstrumentWithBadge,
      [badgeColor]: {
        ...instrument
      }
    }
  })),

  on(InstrumentsActions.initInstrumentsWithBadgesSuccess, (state, instruments) =>({
    ...state,
    selectedInstrumentWithBadge: instruments
  }))
);
