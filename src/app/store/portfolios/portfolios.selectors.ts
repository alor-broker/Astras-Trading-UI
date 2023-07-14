import {
  createFeatureSelector,
} from '@ngrx/store';
import * as fromPortfolios from './portfolios.reducer';


export const selectPortfoliosState = createFeatureSelector<fromPortfolios.PortfoliosState>(
  fromPortfolios.portfoliosFeatureKey
);

