import { createReducer, on } from '@ngrx/store';
import { PortfolioKey } from '../../models/portfolio-key.model';
import * as PortfoliosActions from './portfolios.actions';

export const portfoliosFeatureKey = 'portfolios';

export interface PortfoliosState {
  selectedPortfolio: PortfolioKey | null
}

export const initialState: PortfoliosState = {
  selectedPortfolio: null
};

export const reducer = createReducer(
  initialState,

  on(PortfoliosActions.selectPortfolio, (state, { portfolio }) => ({
      ...state,
      selectedPortfolio: portfolio
    })
  )
);
