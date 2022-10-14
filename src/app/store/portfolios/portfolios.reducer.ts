import {
  createReducer,
  on
} from '@ngrx/store';
import * as PortfoliosActions from './portfolios.actions';
import { PortfolioKey } from '../../shared/models/portfolio-key.model';
import {
  createEntityAdapter,
  EntityAdapter,
  EntityState
} from '@ngrx/entity';
import { PortfolioExtended } from '../../shared/models/user/portfolio-extended.model';
import { EntityStatus } from '../../shared/models/enums/entity-status';

export const portfoliosFeatureKey = 'portfolios';

export interface PortfoliosState extends EntityState<PortfolioExtended> {
  status: EntityStatus
  selectedPortfolio: PortfolioKey | null
}

export const adapter: EntityAdapter<PortfolioExtended> = createEntityAdapter<PortfolioExtended>({
  selectId: model => `${model.portfolio}_${model.exchange}_${model.marketType}`
});

export const initialState: PortfoliosState = adapter.getInitialState({
  status: EntityStatus.Initial,
  selectedPortfolio: null
});

export const reducer = createReducer(
  initialState,

  on(PortfoliosActions.selectNewPortfolio, (state, { portfolio }) => ({
      ...state,
      selectedPortfolio: portfolio
    })
  ),

  on(PortfoliosActions.initPortfolios, (state) => ({
    ...state,
    status: EntityStatus.Loading
  })),

  on(PortfoliosActions.initPortfoliosSuccess, (state, { portfolios }) => {
      return adapter.addMany(
        portfolios,
        {
          ...state,
          status: EntityStatus.Success
        }
      );
    }
  )
);
