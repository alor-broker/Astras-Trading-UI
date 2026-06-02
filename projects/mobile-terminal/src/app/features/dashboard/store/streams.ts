import {Store} from '@ngrx/store';
import {Dashboard} from '@terminal-core-lib/features/dashboard/types/dashboard.types';
import {
  distinctUntilChanged,
  filter,
  map,
  Observable
} from 'rxjs';
import {
  MobileDashboardFeature,
  State
} from './reducer';
import {EntityStatus} from '@terminal-core-lib/common/types/entity-status.types';

export class MobileDashboardStreams {
  static getMobileDashboard(store: Store): Observable<Dashboard> {
    return this.getState(store).pipe(
      map(x => x.dashboard),
      filter((x): x is Dashboard => !!x),
      distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr))
    );
  }

  private static getState(store: Store): Observable<State> {
    return store.select(MobileDashboardFeature.selectMobileDashboardState).pipe(
      filter(state => state.status === EntityStatus.Success),
    );
  }
}
