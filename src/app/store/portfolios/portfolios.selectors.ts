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

export const getAllPortfolios = createSelector(
  selectPortfoliosState,
  selectors.selectAll
);
