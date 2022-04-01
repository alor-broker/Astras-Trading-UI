import { createReducer, on } from "@ngrx/store";
import { Instrument } from "../../models/instruments/instrument.model";
import { PortfolioKey } from "../../models/portfolio-key.model";
import { selectNewInstrument, selectNewPortfolio } from "../actions/sync.actions";

export type SyncState = { instrument:Instrument, portfolio: PortfolioKey | null };

const initialState : SyncState = {
  instrument: {
    symbol: 'SBER',
    exchange: 'MOEX',
    instrumentGroup: 'TQBR',
    isin: 'RU0009029540'
  },
  portfolio: null
}

export const syncReducer = createReducer(
  initialState,
  on(selectNewInstrument, (state, { instrument }) => {
    return {...state, instrument: {
      symbol: instrument.symbol,
      exchange: instrument.exchange,
      instrumentGroup: instrument.instrumentGroup,
      isin: instrument.isin
    }};
  }),
  on(selectNewPortfolio, (state, { portfolio }) => ({ ...state, portfolio })),
);
