import {
  createAction,
  props
} from '@ngrx/store';
import { PortfolioKey } from '../../shared/models/portfolio-key.model';
import { PortfolioExtended } from '../../shared/models/user/portfolio-extended.model';

export const initPortfolios = createAction(
  '[Portfolios] Init'
);

export const initPortfoliosSuccess = createAction(
  '[Portfolios] Init (SUCCESS)',
  props<{ portfolios: PortfolioExtended[] }>()
);

export const selectNewPortfolio = createAction('[Portfolios] SelectNewPortfolio', props<{ portfolio: PortfolioKey | null }>());




