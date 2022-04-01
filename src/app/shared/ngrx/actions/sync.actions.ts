import { createAction, props } from '@ngrx/store';
import { Instrument } from "../../models/instruments/instrument.model";
import { PortfolioKey } from "../../models/portfolio-key.model";

export const selectNewInstrument = createAction('[Sync] SelectNewPortfolio', props<{ instrument: Instrument}>());
export const selectNewPortfolio = createAction('[Sync] SelectNewInstrument', props<{ portfolio: PortfolioKey | null }>());
