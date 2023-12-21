import { distinctUntilChanged, Observable } from 'rxjs';
import { Dashboard } from '../../shared/models/dashboard/dashboard.model';
import { Store } from '@ngrx/store';
import {
  filter,
  map
} from 'rxjs/operators';
import { EntityStatus } from "../../shared/models/enums/entity-status";
import {
  MobileDashboardFeature,
  State
} from "./mobile-dashboard.reducer";

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
