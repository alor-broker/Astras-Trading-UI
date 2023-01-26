import {
  createAction,
  props
} from '@ngrx/store';
import { PortfolioExtended } from '../../shared/models/user/portfolio-extended.model';

export class PortfoliosActions {
  static initPortfolios = createAction(
    '[Portfolios] Init'
  );
}

/**
 These actions can be dispatched only from store effects
 */
export class InternalPortfoliosActions {
  static initPortfoliosSuccess = createAction(
    '[Portfolios] Init (SUCCESS)',
    props<{ portfolios: PortfolioExtended[] }>()
  );
}




