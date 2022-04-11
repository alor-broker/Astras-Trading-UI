import { createAction, props } from '@ngrx/store';
import { PortfolioKey } from "../../models/portfolio-key.model";

export const selectPortfolio = createAction('[Portfolios] SelectPortfolio', props<{ portfolio: PortfolioKey | null }>());




