import {Store} from '@ngrx/store';
import {
  filter,
  map,
  Observable
} from 'rxjs';
import {Dashboard} from '../../types/dashboard.types';
import {
  DashboardsFeature,
  State
} from './reducer';
import {EntityStatus} from '../../../../common/types/entity-status.types';

export class DashboardsStreams {
  static getSelectedDashboard(store: Store): Observable<Dashboard> {
    return this.getAllDashboards(store).pipe(
      map(dashboards => dashboards.find(s => s.isSelected ?? false)),
      filter((x): x is Dashboard => !!x)
    );
  }

  static getAllDashboards(store: Store): Observable<Dashboard[]> {
    return this.getState(store).pipe(
      map(state => state.ids.map(id => state.entities[id]!))
    );
  }

  private static getState(store: Store): Observable<State> {
    return store.select(DashboardsFeature.selectDashboardsState).pipe(
      filter(state => state.status === EntityStatus.Success),
    );
  }
}
