import {
  createActionGroup,
  props
} from '@ngrx/store';
import {PortfolioExtended} from '../../../common/types/portfolio.types';

export const PortfoliosInternalActions = createActionGroup({
  source: "Portfolios/Internal",
  events: {
    "Init With List": props<{ portfolios: PortfolioExtended[] }>(),
    "Init Success": props<{ portfolios: PortfolioExtended[] }>()
  }
});
