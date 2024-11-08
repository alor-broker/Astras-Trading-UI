import {
  createActionGroup,
  emptyProps,
  props
} from '@ngrx/store';
import { PortfolioExtended } from '../../shared/models/user/portfolio-extended.model';

export const PortfoliosInternalActions = createActionGroup({
  source: "Portfolios/Internal",
  events: {
    "Init": emptyProps(),
    "Init With List": props<{ portfolios: PortfolioExtended[] }>(),
    "Init Success": props<{ portfolios: PortfolioExtended[] }>()
  }
});
