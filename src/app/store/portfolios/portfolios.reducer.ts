import {
  createFeature,
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
import { PortfoliosInternalActions } from "./portfolios.actions";

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

  on(PortfoliosInternalActions.init, (state) => ({
    ...state,
    status: EntityStatus.Loading
  })),

  on(PortfoliosInternalActions.initWithList, (state) => ({
    ...state,
    status: EntityStatus.Loading
  })),

  on(PortfoliosInternalActions.initSuccess, (state, { portfolios }) => {
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
