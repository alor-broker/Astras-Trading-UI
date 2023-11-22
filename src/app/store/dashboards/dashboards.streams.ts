import { Observable } from 'rxjs';
import { Dashboard } from '../../shared/models/dashboard/dashboard.model';
import { Store } from '@ngrx/store';
import {
  filter,
  map
} from 'rxjs/operators';
import { EntityStatus } from "../../shared/models/enums/entity-status";
import {
  DashboardsFeature,
  State
} from "./dashboards.reducer";

export class DashboardsStreams {
  static getSelectedDashboard(store: Store): Observable<Dashboard> {
    return this.getAllDashboards(store).pipe(
      map(dashboards => dashboards.find(s => s.isSelected)),
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
