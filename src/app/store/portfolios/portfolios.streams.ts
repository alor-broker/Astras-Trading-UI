import {
  filter,
  Observable
} from 'rxjs';
import { PortfolioExtended } from '../../shared/models/user/portfolio-extended.model';
import { selectPortfoliosState } from './portfolios.selectors';
import { Store } from '@ngrx/store';
import { EntityStatus } from '../../shared/models/enums/entity-status';
import { map } from 'rxjs/operators';

export class PortfoliosStreams {
  static getAllPortfolios(store: Store): Observable<PortfolioExtended[]> {
    return store.select(selectPortfoliosState).pipe(
      filter(s => s.status === EntityStatus.Success),
      map(s => Object.values(s.entities).map(x => x!) ?? [])
    );
  }
}
