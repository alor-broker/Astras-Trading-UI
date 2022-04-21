import { createFeatureSelector, createSelector } from '@ngrx/store';
import * as fromPortfolios from './portfolios.reducer';

export const selectPortfoliosState = createFeatureSelector<fromPortfolios.PortfoliosState>(
  fromPortfolios.portfoliosFeatureKey
);

export const getSelectedPortfolio = createSelector(
  selectPortfoliosState,
  (state) => state.selectedPortfolio
);
