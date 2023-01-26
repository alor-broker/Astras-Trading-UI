import {
  createReducer,
  on
} from '@ngrx/store';
import {
  createEntityAdapter,
  EntityAdapter,
  EntityState
} from '@ngrx/entity';
import { PortfolioExtended } from '../../shared/models/user/portfolio-extended.model';
import { EntityStatus } from '../../shared/models/enums/entity-status';
import {
  InternalPortfoliosActions,
  PortfoliosActions
} from './portfolios.actions';

export const portfoliosFeatureKey = 'portfolios';

export interface PortfoliosState extends EntityState<PortfolioExtended> {
  status: EntityStatus
}

export const adapter: EntityAdapter<PortfolioExtended> = createEntityAdapter<PortfolioExtended>({
  selectId: model => `${model.portfolio}_${model.exchange}_${model.marketType}`
});

export const initialState: PortfoliosState = adapter.getInitialState({
  status: EntityStatus.Initial
});

export const reducer = createReducer(
  initialState,

  on(PortfoliosActions.initPortfolios, (state) => ({
    ...state,
    status: EntityStatus.Loading
  })),

  on(InternalPortfoliosActions.initPortfoliosSuccess, (state, { portfolios }) => {
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
