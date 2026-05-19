import {
  inject,
  Injectable
} from '@angular/core';
import {Store} from '@ngrx/store';
import {PortfoliosFeature} from './reducer';
import {
  filter,
  map,
  shareReplay,
  take
} from 'rxjs';
import {EntityStatus} from '../../../common/types/entity-status.types';
import {PortfolioExtended} from '../../../common/types/portfolio.types';
import {PortfoliosInternalActions} from './actions';

@Injectable()
export class PortfoliosStoreFacade {
  private readonly store = inject(Store);

  readonly portfolios$ = this.store.select(PortfoliosFeature.selectPortfoliosState).pipe(
    filter(s => s.status === EntityStatus.Success),
    map(s => Object.values(s.entities).map(x => x!)),
    shareReplay(1)
  );

  init(portfolios: PortfolioExtended[], reset = false): void {
    this.store.select(PortfoliosFeature.selectPortfoliosState).pipe(
      filter(s => s.status === EntityStatus.Initial || reset),
      take(1)
    ).subscribe(() => this.store.dispatch(PortfoliosInternalActions.initWithList({portfolios})));
  }
}
