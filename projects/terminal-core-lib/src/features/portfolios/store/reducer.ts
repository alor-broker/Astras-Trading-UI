import {
  createEntityAdapter,
  EntityAdapter,
  EntityState
} from '@ngrx/entity';
import {PortfolioExtended} from '../../../common/types/portfolio.types';
import {EntityStatus} from '../../../common/types/entity-status.types';
import {
  createFeature,
  createReducer,
  on
} from '@ngrx/store';
import {PortfoliosInternalActions} from './actions';

export interface PortfoliosState extends EntityState<PortfolioExtended> {
  status: EntityStatus;
}

const adapter: EntityAdapter<PortfolioExtended> = createEntityAdapter<PortfolioExtended>({
  selectId: model => `${model.portfolio}_${model.exchange}_${model.marketType}`
});

export const initialState: PortfoliosState = adapter.getInitialState({
  status: EntityStatus.Initial
});

const reducer = createReducer(
  initialState,

  on(PortfoliosInternalActions.initWithList, (state) => ({
    ...state,
    status: EntityStatus.Loading
  })),

  on(PortfoliosInternalActions.initSuccess, (state, {portfolios}) => {
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

export const PortfoliosFeature = createFeature({
  name: 'Portfolios',
  reducer
});
