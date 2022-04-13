import { createAction, props } from '@ngrx/store';
import { PortfolioKey } from '../../shared/models/portfolio-key.model';

export const selectNewPortfolio = createAction('[Portfolios] SelectNewPortfolio', props<{ portfolio: PortfolioKey | null }>());




