import { createReducer, on } from '@ngrx/store';
import * as PortfoliosActions from './portfolios.actions';
import { PortfolioKey } from '../../shared/models/portfolio-key.model';

export const portfoliosFeatureKey = 'portfolios';

export interface PortfoliosState {
  selectedPortfolio: PortfolioKey | null
}

export const initialState: PortfoliosState = {
  selectedPortfolio: null
};

export const reducer = createReducer(
  initialState,

  on(PortfoliosActions.selectNewPortfolio, (state, { portfolio }) => ({
      ...state,
      selectedPortfolio: portfolio
    })
  )
);
