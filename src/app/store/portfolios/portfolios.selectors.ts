import {
  createFeatureSelector,
  createSelector
} from '@ngrx/store';
import * as fromPortfolios from './portfolios.reducer';
import { adapter } from './portfolios.reducer';


export const selectPortfoliosState = createFeatureSelector<fromPortfolios.PortfoliosState>(
  fromPortfolios.portfoliosFeatureKey
);

const selectors = adapter.getSelectors();

export const getSelectedPortfolioKey = createSelector(
  selectPortfoliosState,
  (state) => state.selectedPortfolio
);

export const getSelectedPortfolio = createSelector(
  selectPortfoliosState,
  (state) => {
    if (!state.selectedPortfolio) {
      return null;
    }

    return Object.values(state.entities).find(p =>
      p?.portfolio === state.selectedPortfolio?.portfolio
      && p?.exchange === state.selectedPortfolio?.exchange
      && p?.marketType === state.selectedPortfolio?.marketType);
  }
);

export const getAllPortfolios = createSelector(
  selectPortfoliosState,
  selectors.selectAll
);
